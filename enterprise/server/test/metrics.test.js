import test from "node:test";
import assert from "node:assert/strict";
import {weightedYield,reviewedKpi} from "../src/metrics.js";
test("yield weighted by quantity, not simple average",()=>assert.equal(weightedYield([{total:100,good:90},{total:900,good:891}]),98.1));
test("yield rejects invalid counts",()=>assert.throws(()=>weightedYield([{total:100,good:101}])));
test("no records means no yield",()=>assert.equal(weightedYield([]),null));
test("pending reviews do not affect KPI",()=>assert.deepEqual(reviewedKpi([{status:"Pending manager",approved:100,priority:3,complexity:2}]),{reviewedPoints:0,qualityPercent:null}));
test("reviewed weighted KPI",()=>assert.deepEqual(reviewedKpi([{status:"Reviewed",approved:100,priority:3,complexity:2},{status:"Reviewed",approved:50,priority:1,complexity:2}]),{reviewedPoints:8,qualityPercent:87.5}));
test("KPI rejects invalid weights",()=>assert.throws(()=>reviewedKpi([{status:"Reviewed",approved:100,priority:8,complexity:1}])));
