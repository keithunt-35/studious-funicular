import assert from "node:assert/strict";
import test from "node:test";

import { getUssdResponse } from "./ussd-menu.js";

test("starts with the short main menu", () => {
  const result = getUssdResponse("");

  assert.equal(result.action, "menu");
  assert.match(result.message, /1\. Report Emergency/);
  assert.match(result.message, /2\. My Assigned Tasks/);
});

test("collects severity and description before creating a report", () => {
  assert.match(getUssdResponse("1").message, /Select severity/);
  assert.match(getUssdResponse("1*1").message, /describe the emergency/);

  assert.deepEqual(getUssdResponse("1*1*Power failure at Gate 2"), {
    action: "create_incident",
    severity: "critical",
    description: "Power failure at Gate 2",
  });
});

test("routes assigned tasks and help to terminal responses", () => {
  assert.deepEqual(getUssdResponse("2"), { action: "tasks" });
  assert.match(getUssdResponse("3").message, /^END/);
});