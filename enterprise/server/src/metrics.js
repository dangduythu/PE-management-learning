export function weightedYield(rows) {
  const total=rows.reduce((n,x)=>n+x.total,0),good=rows.reduce((n,x)=>n+x.good,0);
  if (!rows.every(x=>Number.isSafeInteger(x.total)&&x.total>0&&Number.isSafeInteger(x.good)&&x.good>=0&&x.good<=x.total)) throw new Error("Invalid production quantity");
  return total?100*good/total:null;
}
export function reviewedKpi(tasks) {
  const approved=tasks.filter(t=>t.status==="Reviewed"&&Number.isFinite(t.approved)&&t.approved>=0&&t.approved<=100);
  const weight=t=>t.priority*t.complexity;
  if(!approved.every(t=>[t.priority,t.complexity].every(x=>Number.isInteger(x)&&x>=1&&x<=3)))throw new Error("Invalid task weight");
  const points=approved.reduce((n,t)=>n+weight(t),0);
  return {reviewedPoints:points,qualityPercent:points?approved.reduce((n,t)=>n+weight(t)*t.approved,0)/points:null};
}
