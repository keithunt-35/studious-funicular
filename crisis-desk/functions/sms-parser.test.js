import assert from "node:assert/strict";
import test from "node:test";

import { parseInboundSms } from "./sms-parser.js";

test("parses severity, location, title, and original description", () => {
  const result = parseInboundSms("CRITICAL Power failure in Main Hall");

  assert.equal(result.severity, "critical");
  assert.equal(result.location, "Main Hall");
  assert.equal(result.title, "Critical: Power failure in Main Hall");
  assert.equal(result.description, "CRITICAL Power failure in Main Hall");
});

test("defaults missing severity to medium and supports at locations", () => {
  const result = parseInboundSms("Medical assistance needed at Gate 2");

  assert.equal(result.severity, "medium");
  assert.equal(result.location, "Gate 2");
  assert.match(result.title, /^Medium:/);
});