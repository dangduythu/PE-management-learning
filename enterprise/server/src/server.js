import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import pg from "pg";
import { z } from "zod";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";

const { DATABASE_URL, OIDC_ISSUER, OIDC_AUDIENCE, OIDC_JWKS_URL, CORS_ORIGIN, NODE_ENV } = process.env;
if (![DATABASE_URL, OIDC_ISSUER, OIDC_AUDIENCE, OIDC_JWKS_URL, CORS_ORIGIN].every(Boolean)) {
  throw new Error("Missing required environment settings (see .env.example)");
}
if (!/^https:\/\//.test(OIDC_ISSUER) || !/^https:\/\//.test(OIDC_JWKS_URL)) throw new Error("OIDC requires HTTPS");
const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 10 });
const keys = createRemoteJWKSet(new URL(OIDC_JWKS_URL));
const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN.split(",").map(s => s.trim()), methods: ["GET", "POST", "PATCH"], allowedHeaders: ["Authorization","Content-Type"] }));
app.use(express.json({ limit: "256kb" }));
app.get("/healthz", (_req, res) => res.json({ status: "ok", service: "pe-management-api" }));
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
app.use("/api", asyncRoute(async (req, res, next) => {
  const token = /^Bearer (.+)$/i.exec(req.headers.authorization || "")?.[1];
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const { payload } = await jwtVerify(token, keys, { issuer: OIDC_ISSUER, audience: OIDC_AUDIENCE, algorithms: ["RS256","ES256"] });
    if (!payload.sub) return res.status(401).json({ error: "Invalid subject" });
    req.actor = String(payload.sub);
    const { rows } = await pool.query("SELECT role FROM role_grants WHERE user_id=$1", [req.actor]);
    req.roles = rows.map(r => r.role);
    next();
  } catch { return res.status(401).json({ error: "Invalid or expired token" }); }
}));
const hasRole = (...roles) => (req, res, next) => req.roles.some(r => roles.includes(r)) ? next() : res.status(403).json({ error: "Forbidden" });
const parse = (schema, body) => schema.safeParse(body);
const addAudit = (client, actor, entity, entityId, action, detail) => client.query(
  "INSERT INTO audit_events(actor_id,entity,entity_id,action,detail) VALUES($1,$2,$3,$4,$5::jsonb)",
  [actor,entity,entityId,action,JSON.stringify(detail)]
);
const transaction = async fn => {
  const client=await pool.connect();
  try { await client.query("BEGIN"); const result=await fn(client); await client.query("COMMIT"); return result; }
  catch(e){await client.query("ROLLBACK");throw e;} finally{client.release();}
};
app.get("/api/me", asyncRoute(async(req,res)=>{
  const { rows }=await pool.query("SELECT id,display_name,email FROM app_users WHERE id=$1",[req.actor]);
  res.json({ user: rows[0] || null, roles:req.roles });
}));
app.get("/api/tasks", asyncRoute(async(req,res)=>{
  const where=req.roles.some(r=>["leader","manager"].includes(r))?"":"WHERE t.owner_id=$1";
  const args=where?[req.actor]:[];
  const {rows}=await pool.query("SELECT t.* FROM tasks t "+where+" ORDER BY t.updated_at DESC LIMIT 500",args);
  res.json({items:rows});
}));
const taskInput=z.object({name:z.string().trim().min(1).max(250),ownerId:z.string().min(1),issueId:z.string().uuid().nullable().optional(),priority:z.number().int().min(1).max(3).default(2),complexity:z.number().int().min(1).max(3).default(2),dueDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()});
app.post("/api/tasks",hasRole("leader","manager"),asyncRoute(async(req,res)=>{
  const x=parse(taskInput,req.body);if(!x.success)return res.status(400).json({error:x.error.flatten()});
  const d=x.data,taskId=randomUUID();
  await transaction(async c=>{
    const owner=await c.query("SELECT id FROM app_users WHERE id=$1",[d.ownerId]);
    if(!owner.rowCount){const e=new Error("Unknown owner");e.status=400;throw e;}
    await c.query("INSERT INTO tasks(id,name,owner_id,created_by,issue_id,priority,complexity,due_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[taskId,d.name,d.ownerId,req.actor,d.issueId||null,d.priority,d.complexity,d.dueDate||null]);
    await addAudit(c,req.actor,"task",taskId,"created",{ownerId:d.ownerId});
  });
  res.status(201).json({id:taskId});
}));
const updateInput=z.object({progress:z.number().int().min(0).max(100),evidence:z.string().max(20000),revision:z.number().int().positive(),submit:z.boolean().default(false)});
app.patch("/api/tasks/:id/progress",asyncRoute(async(req,res)=>{
  const p=parse(updateInput,req.body);if(!p.success)return res.status(400).json({error:p.error.flatten()});
  const {id}=req.params;if(!z.string().uuid().safeParse(id).success)return res.status(400).json({error:"Invalid ID"});
  const x=p.data;
  const result=await transaction(async c=>{
    const {rows}=await c.query("SELECT * FROM tasks WHERE id=$1 FOR UPDATE",[id]);
    const t=rows[0];if(!t)return {status:404,error:"Task not found"};
    if(t.owner_id!==req.actor)return {status:403,error:"Only task owner can update progress"};
    if(t.revision!==x.revision)return {status:409,error:"Revision conflict: reload task"};
    if(!["Not started","In progress","Rejected"].includes(t.status))return {status:409,error:"Task currently locked for review"};
    const next=x.submit?"Pending leader":x.progress?"In progress":"Not started";
    await c.query("UPDATE tasks SET progress=$2,evidence=$3,status=$4,approved_percent=NULL,revision=revision+1,updated_at=now() WHERE id=$1",[id,x.progress,x.evidence,next]);
    await addAudit(c,req.actor,"task",id,x.submit?"submitted":"progress_updated",{progress:x.progress});
    return {status:200,state:next,revision:t.revision+1};
  });res.status(result.status).json(result);
}));
const reviewInput=z.object({decision:z.enum(["approve","reject"]),verifiedPercent:z.number().int().min(0).max(100),comment:z.string().trim().min(1).max(10000),revision:z.number().int().positive()});
app.post("/api/tasks/:id/reviews",asyncRoute(async(req,res)=>{
  const p=parse(reviewInput,req.body);if(!p.success)return res.status(400).json({error:p.error.flatten()});
  const {id}=req.params;if(!z.string().uuid().safeParse(id).success)return res.status(400).json({error:"Invalid ID"});
  const x=p.data;
  const outcome=await transaction(async c=>{
    const {rows}=await c.query("SELECT * FROM tasks WHERE id=$1 FOR UPDATE",[id]);
    const t=rows[0];if(!t)return {status:404,error:"Task not found"};
    if(t.owner_id===req.actor)return {status:403,error:"Self approval not allowed"};
    if(t.revision!==x.revision)return {status:409,error:"Revision conflict: reload task"};
    const isLeader=t.status==="Pending leader",isManager=t.status==="Pending manager";
    if(!isLeader&&!isManager)return {status:409,error:"Task is not waiting for approval"};
    if(isLeader&&!req.roles.includes("leader")||isManager&&!req.roles.includes("manager"))return {status:403,error:"Wrong approval level"};
    const stage=isLeader?"leader":"manager", next=x.decision==="reject"?"Rejected":isLeader?"Pending manager":"Reviewed";
    const approved=next==="Reviewed"?x.verifiedPercent:null;
    await c.query("INSERT INTO review_decisions(id,task_id,reviewer_id,stage,decision,verified_percent,comment) VALUES($1,$2,$3,$4,$5,$6,$7)",[randomUUID(),id,req.actor,stage,x.decision,x.verifiedPercent,x.comment]);
    await c.query("UPDATE tasks SET status=$2,approved_percent=$3,revision=revision+1,updated_at=now() WHERE id=$1",[id,next,approved]);
    await addAudit(c,req.actor,"task",id,"reviewed",{stage,decision:x.decision,verifiedPercent:x.verifiedPercent});
    return {status:200,state:next,revision:t.revision+1};
  });res.status(outcome.status).json(outcome);
}));
app.get("/api/kpi",hasRole("leader","manager"),asyncRoute(async(_req,res)=>{
  const {rows}=await pool.query("SELECT owner_id,COUNT(*)::int AS reviewed_tasks,SUM(priority*complexity)::int AS reviewed_points,ROUND(SUM(priority*complexity*approved_percent)::numeric/NULLIF(SUM(priority*complexity),0),2) AS quality_percent FROM tasks WHERE status='Reviewed' AND approved_percent IS NOT NULL GROUP BY owner_id ORDER BY reviewed_points DESC");
  res.json({items:rows,definition:"Weighted approved completion only; workload and pending review tracked separately"});
}));
app.get("/api/issues",asyncRoute(async(req,res)=>{
  const {rows}=await pool.query("SELECT id,inspection_id,title,line,status,archived,owner_id,created_at FROM issues WHERE archived=$1 ORDER BY created_at DESC LIMIT 500",[req.query.archived==="true"]);
  res.json({items:rows});
}));
app.post("/api/issues/:id/archive",hasRole("leader","manager"),asyncRoute(async(req,res)=>{
  const data=z.object({archived:z.boolean()}).safeParse(req.body);
  if(!data.success)return res.status(400).json({error:"Expected archived boolean"});
  const id=req.params.id;if(!z.string().uuid().safeParse(id).success)return res.status(400).json({error:"Invalid ID"});
  const outcome=await transaction(async c=>{
    const r=await c.query("UPDATE issues SET archived=$2 WHERE id=$1 RETURNING id,archived",[id,data.data.archived]);
    if(!r.rowCount)return null;
    await addAudit(c,req.actor,"issue",id,data.data.archived?"archived":"restored",{});
    return r.rows[0];
  });if(!outcome)return res.status(404).json({error:"Issue not found"});res.json(outcome);
}));

const inspectionInput=z.object({templateName:z.string().trim().min(1).max(160),line:z.string().trim().min(1).max(80),productionDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),results:z.array(z.object({item:z.string().trim().min(1).max(200),result:z.enum(["OK","NG","NA"]),value:z.union([z.string().max(1000),z.number()]).optional(),standard:z.string().max(500).optional()})).min(1).max(300)});
app.post("/api/inspections",hasRole("technician","engineer","leader","manager"),asyncRoute(async(req,res)=>{
 const p=inspectionInput.safeParse(req.body);if(!p.success)return res.status(400).json({error:p.error.flatten()});
 const d=p.data,ng=d.results.filter(x=>x.result==="NG"),inspectionId=randomUUID();
 const issueIds=await transaction(async c=>{
   await c.query("INSERT INTO inspections(id,performed_by,template_name,line,production_date,result,results) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)",[inspectionId,req.actor,d.templateName,d.line,d.productionDate,ng.length?"NG":"OK",JSON.stringify(d.results)]);
   const ids=[];
   for(const item of ng){const issueId=randomUUID();await c.query("INSERT INTO issues(id,inspection_id,title,line) VALUES($1,$2,$3,$4)",[issueId,inspectionId,item.item,d.line]);ids.push(issueId);}
   await addAudit(c,req.actor,"inspection",inspectionId,"created",{ng:ng.length,issues:ids});
   return ids;
 });
 res.status(201).json({id:inspectionId,result:ng.length?"NG":"OK",issueIds});
}));
app.get("/api/inspections",hasRole("technician","engineer","leader","manager"),asyncRoute(async(req,res)=>{
 const privileged=req.roles.some(r=>["leader","manager"].includes(r));
 const {rows}=await pool.query("SELECT id,performed_by,template_name,line,production_date,result,created_at FROM inspections "+(privileged?"":"WHERE performed_by=$1")+" ORDER BY created_at DESC LIMIT 500",privileged?[]:[req.actor]);
 res.json({items:rows});
}));
const productionInput=z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),project:z.string().trim().min(1).max(120),line:z.string().trim().min(1).max(80),lot:z.string().trim().min(1).max(120),total:z.number().int().positive(),good:z.number().int().min(0),defect:z.string().max(120).optional(),defectCount:z.number().int().min(0).default(0)});
app.post("/api/production",hasRole("engineer","leader","manager"),asyncRoute(async(req,res)=>{
 const p=productionInput.safeParse(req.body);if(!p.success)return res.status(400).json({error:p.error.flatten()});
 const d=p.data;if(d.good>d.total||d.defectCount>d.total-d.good)return res.status(400).json({error:"Invalid quantities"});
 const id=randomUUID();
 await transaction(async c=>{await c.query("INSERT INTO production_records(id,production_date,project,line,lot,total_qty,good_qty,defect,defect_qty,entered_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",[id,d.date,d.project,d.line,d.lot,d.total,d.good,d.defect||null,d.defectCount,req.actor]);await addAudit(c,req.actor,"production",id,"created",{project:d.project,line:d.line});});
 res.status(201).json({id});
}));
app.get("/api/production",hasRole("engineer","leader","manager"),asyncRoute(async(req,res)=>{
 const {rows}=await pool.query("SELECT id,production_date,project,line,lot,total_qty,good_qty,defect,defect_qty FROM production_records ORDER BY production_date DESC,created_at DESC LIMIT 1000");
 res.json({items:rows});
}));
app.get("/api/yield",hasRole("engineer","leader","manager"),asyncRoute(async(req,res)=>{
 const {rows}=await pool.query("SELECT line,SUM(total_qty)::bigint AS total_qty,SUM(good_qty)::bigint AS good_qty,ROUND(100.0*SUM(good_qty)/NULLIF(SUM(total_qty),0),2) AS weighted_yield FROM production_records GROUP BY line ORDER BY line");
 res.json({items:rows});
}));
const improvementInput=z.object({title:z.string().trim().min(1).max(250),process:z.string().max(120).default(""),ownerId:z.string().min(1),beforeLoss:z.number().min(0).max(100).nullable().optional(),afterLoss:z.number().min(0).max(100).nullable().optional(),dueDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),evidence:z.string().max(20000).default("")});
app.post("/api/improvements",hasRole("engineer","leader","manager"),asyncRoute(async(req,res)=>{
 const p=improvementInput.safeParse(req.body);if(!p.success)return res.status(400).json({error:p.error.flatten()});
 const d=p.data,id=randomUUID();
 await transaction(async c=>{
   await c.query("INSERT INTO improvement_actions(id,title,process,owner_id,before_loss,after_loss,due_date,evidence) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[id,d.title,d.process,d.ownerId,d.beforeLoss??null,d.afterLoss??null,d.dueDate??null,d.evidence]);
   await addAudit(c,req.actor,"improvement",id,"created",{ownerId:d.ownerId});
 });res.status(201).json({id});
}));
app.get("/api/improvements",hasRole("engineer","leader","manager"),asyncRoute(async(req,res)=>{
 const {rows}=await pool.query("SELECT * FROM improvement_actions ORDER BY created_at DESC LIMIT 500");res.json({items:rows});
}));

app.use((err,_req,res,_next)=>{console.error("API error",err);res.status(err.status||500).json({error:err.status?err.message:"Internal server error"});});
const server=app.listen(Number(process.env.PORT||8080),()=>console.log("PE API listening"));
async function shutdown(){server.close();await pool.end();}
process.on("SIGTERM",shutdown);process.on("SIGINT",shutdown);
