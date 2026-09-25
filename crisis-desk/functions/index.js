import { HttpsError, onCall } from "firebase-functions/v2/https";

import {
  africaTalkingApiKey,
  africaTalkingUsername,
  sendSms,
} from "./africastalking.js";

/**
 * Sends one sandbox SMS so the integration can be verified before event use.
 * This function is intentionally authenticated because it sends a billable API request.
 */
exports.sendTestSms = onCall(
  {
    secrets: [africaTalkingUsername, africaTalkingApiKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in before sending a test SMS.");
    }

    const phoneNumber = request.data?.phoneNumber;
    const message = request.data?.message || "Crisis Desk sandbox SMS test";

    if (typeof phoneNumber !== "string" || !phoneNumber.trim()) {
      throw new HttpsError(
        "invalid-argument",
        "phoneNumber must be a non-empty string in international format."
      );
    }

    if (typeof message !== "string" || !message.trim()) {
      throw new HttpsError("invalid-argument", "message must be a non-empty string.");
    }

    try {
      const result = await sendSms({
        to: phoneNumber.trim(),
        message: message.trim(),
      });

      return {
        ok: true,
        message: "Africa's Talking accepted the sandbox SMS request.",
        providerResponse: result,
      };
    } catch (error) {
      console.error("Africa's Talking test SMS failed", error);
      throw new HttpsError("internal", "The test SMS could not be sent.");
    }
  }
);