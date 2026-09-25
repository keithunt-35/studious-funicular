import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineString } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

import {
  africaTalkingApiKey,
  africaTalkingUsername,
  airtimeRewardAmount,
  airtimeRewardCurrency,
  airtimeRewardsEnabled,
  buildVoiceInstructions,
  sendAirtime,
  sendVoiceCall,
  sendSms,
  ussdEnabled,
} from "./africastalking.js";
import { isCriticalResolution, parseRewardAmount } from "./airtime-reward.js";
import { isFeatureEnabled, isInternationalPhoneNumber } from "./feature-flags.js";
import { parseInboundSms } from "./sms-parser.js";
import { getUssdResponse } from "./ussd-menu.js";
import { buildCriticalIncidentMessage } from "./voice-message.js";

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

  if (!isFeatureEnabled(smsEnabled.value())) {
    console.warn("Inbound SMS is disabled by configuration");
    response.status(200).send("SMS reporting is temporarily disabled");
    return;
  }

  if (!isInternationalPhoneNumber(sender) || !text || text.length > 500) {
    response.status(400).send("Invalid sender or message");
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

  if (!isFeatureEnabled(ussdEnabled.value())) {
    response.type("text/plain").status(200).send("END Crisis Desk USSD is temporarily unavailable.");
    return;
  }

  if (!sessionId || sessionId.length > 128 || !isInternationalPhoneNumber(phoneNumber) || text.length > 500) {
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

async function recordVoiceActivity(incidentId, eventId, actorId, message, metadata) {
  try {
    await db.collection("incidents").doc(incidentId).collection("activities").add({
      incidentId,
      eventId,
      type: "commented",
      message,
      actorId,
      metadata,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Voice activity could not be recorded", error);
  }
}

async function claimVoiceCall(voiceCallReference, data) {
  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(voiceCallReference);
    if (existing.exists) return false;

    transaction.create(voiceCallReference, data);
    return true;
  });
}

/** Calls every active Event Lead when a critical incident is created. */
export const callEventLeadsForCriticalIncident = onDocumentCreated(
  "incidents/{incidentId}",
  async (event) => {
    const incident = event.data?.data();
    const incidentId = event.params.incidentId;

    if (!incident || incident.severity !== "critical") return;

    const eventId = String(incident.eventId ?? defaultEventId.value());
    if (!isFeatureEnabled(voiceEnabled.value())) {
      await recordVoiceActivity(incidentId, eventId, "system:voice", "Voice call skipped because Voice is disabled.", { channel: "voice", status: "disabled" });
      return;
    }

    const message = buildCriticalIncidentMessage(incident);
    const leadSnapshot = await db.collection("users").where("role", "==", "event_lead").get();
    const leads = leadSnapshot.docs.filter((document) => {
      const lead = document.data();
      return lead.isActive !== false && typeof lead.phone === "string" && lead.phone.trim();
    });

    if (leads.length === 0) {
      await recordVoiceActivity(incidentId, eventId, "system:voice", "No active Event Lead phone number is configured for the critical incident.", { channel: "voice", status: "skipped" });
      return;
    }

    await Promise.all(leads.map(async (leadDocument) => {
      const lead = leadDocument.data();
      const phoneNumber = lead.phone.trim();
      const clientRequestId = `${incidentId}_${leadDocument.id}`;
      const voiceCallReference = db.collection("voiceCalls").doc(clientRequestId);
      const claimed = await claimVoiceCall(voiceCallReference, {
        incidentId,
        eventId,
        recipientUid: leadDocument.id,
        recipientPhone: phoneNumber,
        message,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (!claimed) return;

      try {
        const providerResponse = await sendVoiceCall({ to: phoneNumber, clientRequestId });
        await voiceCallReference.update({ status: "requested", providerResponse: String(providerResponse?.entries?.[0]?.status ?? "accepted"), updatedAt: FieldValue.serverTimestamp() });
        await recordVoiceActivity(incidentId, eventId, "system:voice", `Voice call requested for Event Lead ${lead.displayName ?? leadDocument.id}.`, { channel: "voice", recipient: phoneNumber, status: "requested" });
      } catch (error) {
        console.error("Africa's Talking voice call failed", { incidentId, recipient: phoneNumber, error });
        await voiceCallReference.update({ status: "failed", error: error instanceof Error ? error.message : "Unknown voice error", updatedAt: FieldValue.serverTimestamp() });
        await recordVoiceActivity(incidentId, eventId, "system:voice", `Voice call failed for Event Lead ${lead.displayName ?? leadDocument.id}.`, { channel: "voice", recipient: phoneNumber, status: "failed" });
      }
    }));
  }
);

/** Returns the text-to-speech instructions for an outbound Africa's Talking call. */
export const voiceInstructions = onRequest(
  { secrets: [africaTalkingUsername, africaTalkingApiKey] },
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    const clientRequestId = typeof request.body?.clientRequestId === "string" ? request.body.clientRequestId : "";
    let message = "Attention. Please check the Crisis Desk command center immediately.";

    if (clientRequestId) {
      const voiceCall = await db.collection("voiceCalls").doc(clientRequestId).get();
      if (voiceCall.exists && typeof voiceCall.data()?.message === "string") {
        message = voiceCall.data().message;
      }
    }

    try {
      response.type("application/xml").status(200).send(buildVoiceInstructions(message));
    } catch (error) {
      console.error("Voice instructions could not be built", error);
      response.type("application/xml").status(200).send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Reject/></Response>");
    }
  }
);

async function recordAirtimeActivity(incidentId, eventId, message, metadata) {
  try {
    await db.collection("incidents").doc(incidentId).collection("activities").add({
      incidentId,
      eventId,
      type: "commented",
      message,
      actorId: "system:airtime",
      metadata,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Airtime activity could not be recorded", error);
  }
}

async function claimAirtimeReward(rewardReference, data) {
  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(rewardReference);
    if (existing.exists) return false;

    transaction.create(rewardReference, data);
    return true;
  });
}

/** Sends one configurable airtime reward after a Critical incident is resolved. */
export const rewardCriticalIncidentResolver = onDocumentUpdated(
  {
    document: "incidents/{incidentId}",
    secrets: [africaTalkingUsername, africaTalkingApiKey],
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const incidentId = event.params.incidentId;

    if (!before || !after || !isCriticalResolution(before, after)) return;

    const eventId = String(after.eventId ?? defaultEventId.value());
    if (airtimeRewardsEnabled.value().toLowerCase() !== "true") {
      await recordAirtimeActivity(incidentId, eventId, "Airtime reward skipped because rewards are disabled.", { channel: "airtime", status: "disabled" });
      return;
    }

    const rewardAmount = parseRewardAmount(airtimeRewardAmount.value());
    const currencyCode = airtimeRewardCurrency.value().trim().toUpperCase();
    const resolverId = typeof after.resolvedBy === "string" ? after.resolvedBy : "";

    if (!resolverId || !rewardAmount || !/^[A-Z]{3}$/.test(currencyCode)) {
      await recordAirtimeActivity(incidentId, eventId, "Airtime reward skipped because the resolver or reward configuration is missing.", { channel: "airtime", status: "skipped" });
      return;
    }

    const resolverSnapshot = await db.collection("users").doc(resolverId).get();
    const resolver = resolverSnapshot.data();
    const phoneNumber = typeof resolver?.phone === "string" ? resolver.phone.trim() : "";

    if (!phoneNumber) {
      await recordAirtimeActivity(incidentId, eventId, "Airtime reward skipped because the resolver has no phone number.", { channel: "airtime", status: "skipped", resolverId });
      return;
    }

    const rewardReference = db.collection("airtimeRewards").doc(incidentId);
    const claimed = await claimAirtimeReward(rewardReference, {
      incidentId,
      eventId,
      recipientUid: resolverId,
      recipientPhone: phoneNumber,
      amount: rewardAmount,
      currencyCode,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (!claimed) return;

    try {
      const providerResponse = await sendAirtime({ phoneNumber, currencyCode, amount: rewardAmount });
      await rewardReference.update({ status: "requested", providerResponse: String(providerResponse?.responses?.[0]?.status ?? "accepted"), updatedAt: FieldValue.serverTimestamp() });
      await recordAirtimeActivity(incidentId, eventId, `Airtime reward requested for ${resolver?.displayName ?? resolverId}.`, { channel: "airtime", status: "requested", recipient: phoneNumber, amount: String(rewardAmount), currencyCode });
    } catch (error) {
      console.error("Africa's Talking airtime reward failed", { incidentId, recipient: phoneNumber, error });
      await rewardReference.update({ status: "failed", error: error instanceof Error ? error.message : "Unknown airtime error", updatedAt: FieldValue.serverTimestamp() });
      await recordAirtimeActivity(incidentId, eventId, `Airtime reward failed for ${resolver?.displayName ?? resolverId}.`, { channel: "airtime", status: "failed", recipient: phoneNumber, amount: String(rewardAmount), currencyCode });
    }
  }
);

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

    if (!isFeatureEnabled(smsEnabled.value())) {
      throw new HttpsError("failed-precondition", "SMS is disabled by configuration.");
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