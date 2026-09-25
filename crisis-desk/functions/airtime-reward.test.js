import assert from "node:assert/strict";
import test from "node:test";

import { isCriticalResolution, parseRewardAmount } from "./airtime-reward.js";

test("only rewards a newly resolved critical incident", () => {
  assert.equal(isCriticalResolution({ status: "open" }, { status: "resolved", severity: "critical" }), true);
  assert.equal(isCriticalResolution({ status: "resolved" }, { status: "resolved", severity: "critical" }), false);
  assert.equal(isCriticalResolution({ status: "open" }, { status: "resolved", severity: "high" }), false);
});

test("accepts positive configurable amounts and rejects invalid values", () => {
  assert.equal(parseRewardAmount("50"), 50);
  assert.equal(parseRewardAmount("1000.5"), 1000.5);
  assert.equal(parseRewardAmount("0"), null);
  assert.equal(parseRewardAmount("not-a-number"), null);
});