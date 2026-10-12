import test from "node:test";import assert from "node:assert/strict";import {authorizeReview,canUpdateTask,nextReviewStatus,validProduction} from "../src/rules.js";
test("reject self approval",()=>assert.equal(authorizeReview({task:{owner_id:"a",status:"Pending manager"},actor:"a",roles:["manager"]}).ok,false));
test("leader can review only first stage",()=>assert.equal(authorizeReview({task:{owner_id:"a",status:"Pending manager"},actor:"b",roles:["leader"]}).ok,false));
test("manager final approval",()=>assert.deepEqual(authorizeReview({task:{owner_id:"a",status:"Pending manager"},actor:"b",roles:["manager"]}),{ok:true,stage:"manager"}));
test("review workflow transitions",()=>{assert.equal(nextReviewStatus("leader","approve"),"Pending manager");assert.equal(nextReviewStatus("manager","approve"),"Reviewed");assert.equal(nextReviewStatus("manager","reject"),"Rejected")});
test("task editing is owner-scoped",()=>{assert.equal(canUpdateTask({task:{owner_id:"a",status:"In progress"},actor:"b"}),false);assert.equal(canUpdateTask({task:{owner_id:"a",status:"In progress"},actor:"a"}),true)});
test("production validation",()=>{assert.equal(validProduction({total:100,good:97,defectCount:3}),true);assert.equal(validProduction({total:100,good:101}),false);assert.equal(validProduction({total:100,good:97,defectCount:4}),false)});
