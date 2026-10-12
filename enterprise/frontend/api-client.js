// Browser API client for company-SSO integration. Token supplier must be provided by IT-approved OIDC client.
export class PEApiClient{
  constructor({baseUrl="",getAccessToken}){if(typeof getAccessToken!=="function")throw new Error("Provide OIDC access token supplier");this.baseUrl=baseUrl.replace(/\/$/,"");this.getAccessToken=getAccessToken}
  async request(path,{method="GET",body,signal}={}){const token=await this.getAccessToken();if(!token)throw new Error("No valid sign-in session");const res=await fetch(this.baseUrl+path,{method,headers:{Authorization:"Bearer "+token,...(body===undefined?{}:{"Content-Type":"application/json"})},body:body===undefined?undefined:JSON.stringify(body),signal,cache:"no-store"});let data;try{data=await res.json()}catch{data={}}if(!res.ok)throw Object.assign(new Error(data.error?.message||data.error||"Request failed "+res.status),{status:res.status,details:data});return data}
  me(){return this.request("/api/me")}
  tasks(){return this.request("/api/tasks")}
  createTask(body){return this.request("/api/tasks",{method:"POST",body})}
  updateTask(id,body){return this.request("/api/tasks/"+encodeURIComponent(id)+"/progress",{method:"PATCH",body})}
  reviewTask(id,body){return this.request("/api/tasks/"+encodeURIComponent(id)+"/reviews",{method:"POST",body})}
  inspections(){return this.request("/api/inspections")}
  createInspection(body){return this.request("/api/inspections",{method:"POST",body})}
  issues(archived=false){return this.request("/api/issues?archived="+archived)}
  archiveIssue(id,archived){return this.request("/api/issues/"+encodeURIComponent(id)+"/archive",{method:"POST",body:{archived}})}
  production(){return this.request("/api/production")}
  createProduction(body){return this.request("/api/production",{method:"POST",body})}
  yieldReport(){return this.request("/api/yield")}
  improvements(){return this.request("/api/improvements")}
  createImprovement(body){return this.request("/api/improvements",{method:"POST",body})}
  kpi(){return this.request("/api/kpi")}
}
