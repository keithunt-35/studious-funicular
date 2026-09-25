import assert from "node:assert/strict";
import test from "node:test";

import { isFeatureEnabled, isInternationalPhoneNumber } from "./feature-flags.js";

test("recognizes explicit enabled flag values", () => {
  assert.equal(isFeatureEnabled("true"), true);
  assert.equal(isFeatureEnabled("ON"), true);
  assert.equal(isFeatureEnabled("false"), false);
  assert.equal(isFeatureEnabled(""), false);
});

test("accepts international phone numbers and rejects unsafe input", () => {
  assert.equal(isInternationalPhoneNumber("+254700000000"), true);
  assert.equal(isInternationalPhoneNumber("0700000000"), false);
  assert.equal(isInternationalPhoneNumber("+254"), false);
});