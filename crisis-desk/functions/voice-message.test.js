import assert from "node:assert/strict";
import test from "node:test";

import { buildCriticalIncidentMessage } from "./voice-message.js";

test("builds a calm critical incident call message", () => {
  const message = buildCriticalIncidentMessage({
    category: "Security",
    description: "Crowd gathering at the entrance",
    location: "Gate 2",
  });

  assert.equal(
    message,
    "Attention! A critical Security has been reported at Gate 2. Crowd gathering at the entrance. Please check your command center immediately."
  );
});