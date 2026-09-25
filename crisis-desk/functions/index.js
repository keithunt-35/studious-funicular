import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

import {
  africaTalkingApiKey,
  africaTalkingUsername,
  sendSms,
} from "./africastalking.js";
import { parseInboundSms } from "./sms-parser.js";
import { getUssdResponse } from "./ussd-menu.js";

initializeApp();
const db = getFirestore();
const defaultEventId = defineString("DEFAULT_EVENT_ID", { default: "default-event" });

async function createIncident({ reportedBy, title, description, severity, location, channel, sender }) {
  const eventId = defaultEventId.value();
  const incidentReference = db.collection("incidents").doc();

  const activityReference = incidentReference.collection("activities").doc();
  const batch = db.batch();

  batch.set(incidentReference, {
    title,
    description,
    severity,
    status: "open",
    category: "Other",
    location,
    reportedBy,
    assignedTo: null,
    eventId,
    photoUrl: null,
    resolvedBy: null,
    resolutionNotes: null,
    resolvedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  batch.set(activityReference, {
    incidentId: incidentReference.id,
    eventId,
    type: "created",
    message: `Incident created via ${channel.toUpperCase()} from ${sender}`,
    actorId: reportedBy,
    metadata: { channel, sender },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return incidentReference.id;
}

async function createIncidentFromSms({ sender, text }) {
  const parsed = parseInboundSms(text);

  return createIncident({
    reportedBy: `sms:${sender}`,
    title: parsed.title,
    description: parsed.description,
    severity: parsed.severity,
    location: parsed.location,
    channel: "sms",
    sender,
  });
}

async function createIncidentFromUssd({ sender, severity, description }) {
  const title = `${severity[0].toUpperCase()}${severity.slice(1)}: ${description}`;

  return createIncident({
    reportedBy: `ussd:${sender}`,
    title: title.length > 100 ? `${title.slice(0, 97)}...` : title,
    description,
    severity,
    location: null,
    channel: "ussd",
    sender,
  });
}

async function getAssignedTasks(phoneNumber) {
  const userSnapshot = await db.collection("users").where("phone", "==", phoneNumber).limit(1).get();

  if (userSnapshot.empty) {
    return "END This phone number is not linked to a Crisis Desk profile.";
  }

  const userId = userSnapshot.docs[0].id;
  const incidentSnapshot = await db.collection("incidents").where("assignedTo", "==", userId).limit(20).get();
  const tasks = incidentSnapshot.docs
    .map((document) => ({ id: document.id, ...document.data() }))
    .filter((incident) => incident.eventId === defaultEventId.value() && ["open", "in_progress"].includes(incident.status))
    .sort((first, second) => second.createdAt.toMillis() - first.createdAt.toMillis());

  if (tasks.length === 0) {
    return "END You have no open assigned tasks.";
  }

  const lines = tasks.slice(0, 3).map((task, index) => {
    const title = String(task.title ?? "Untitled task").slice(0, 42);
    return `${index + 1}. ${title}`;
  });
  const remaining = tasks.length > 3 ? `\n+${tasks.length - 3} more in dashboard.` : "";
  return `END Your open tasks:\n${lines.join("\n")}${remaining}`;
}

/** Receives Africa's Talking inbound SMS callbacks and creates an incident. */
export const inboundSms = onRequest(async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  const sender = typeof request.body?.from === "string" ? request.body.from.trim() : "";
  const text = typeof request.body?.text === "string" ? request.body.text.trim() : "";

  if (!sender || !text) {
    response.status(400).send("Missing from or text");
    return;
  }

  try {
    const id = await createIncidentFromSms({ sender, text });
    const parsed = parseInboundSms(text);
    let confirmationMessage = "SMS confirmation sent";

    try {
      await sendSms({
        to: sender,
        message: `Crisis Desk received your ${parsed.severity} report${parsed.location ? ` for ${parsed.location}` : ""}. Incident ${id} is now open.`,
      });
    } catch (error) {
      // The incident is already saved, so a provider outage cannot lose the report.
      console.error("Africa's Talking SMS confirmation failed", error);
      confirmationMessage = "SMS confirmation failed";
    }

    try {
      await db.collection("incidents").doc(id).collection("activities").add({
        incidentId: id,
        eventId: defaultEventId.value(),
        type: "commented",
        message: confirmationMessage,
        actorId: `sms:${sender}`,
        metadata: { channel: "sms", recipient: sender },
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Inbound SMS confirmation activity could not be recorded", error);
    }

    response.status(200).send("OK");
  } catch (error) {
    console.error("Inbound SMS incident creation failed", error);
    response.status(500).send("Unable to process SMS");
  }
});

/** Receives Africa's Talking USSD callbacks for feature-phone workflows. */
export const ussd = onRequest(async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  const sessionId = typeof request.body?.sessionId === "string" ? request.body.sessionId : "";
  const phoneNumber = typeof request.body?.phoneNumber === "string" ? request.body.phoneNumber.trim() : "";
  const text = typeof request.body?.text === "string" ? request.body.text.trim() : "";

  if (!sessionId || !phoneNumber) {
    response.status(400).send("Missing sessionId or phoneNumber");
    return;
  }

  try {
    const flow = getUssdResponse(text);

    if (flow.action === "tasks") {
      response.type("text/plain").status(200).send(await getAssignedTasks(phoneNumber));
      return;
    }

    if (flow.action === "create_incident") {
      const incidentId = await createIncidentFromUssd({
        sender: phoneNumber,
        severity: flow.severity,
        description: flow.description,
      });
      response.type("text/plain").status(200).send(`END Report received. Incident ${incidentId} is open.`);
      return;
    }

    response.type("text/plain").status(200).send(flow.message);
  } catch (error) {
    console.error("USSD request failed", error);
    response.type("text/plain").status(200).send("END Crisis Desk is temporarily unavailable. Please try again.");
  }
});

/**
 * Sends one sandbox SMS so the integration can be verified before event use.
 * This function is intentionally authenticated because it sends a billable API request.
 */
export const sendTestSms = onCall(
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