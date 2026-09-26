import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

function parseInboundSms(text: string) {
  const description = text.replace(/\s+/g, " ").trim();
  const severityMatch = description.match(/\b(critical|high|medium|low)\b/i);
  const severity = (severityMatch?.[1]?.toLowerCase() ?? "medium") as "critical" | "high" | "medium" | "low";
  const locationMatch = description.match(/\b(?:at|in|near)\s+([^.!?;]+)/i);
  const location = locationMatch ? locationMatch[1].replace(/\s+/g, " ").trim() : null;
  const summary = description.replace(/\b(?:critical|high|medium|low)\b[:,-]?/i, "").replace(/[.!?]+$/, "").trim();
  const titleText = summary || (location ? `Incident at ${location}` : "SMS incident report");
  const title = `${severity[0].toUpperCase()}${severity.slice(1)}: ${titleText}`;

  return {
    title: title.length > 100 ? `${title.slice(0, 97)}...` : title,
    description,
    severity,
    location,
  };
}

function getDb() {
  const app = getApps()[0] ?? initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  return getAdminFirestore(app);
}

function maskPhone(phone: string) {
  return phone.length > 4 ? `***${phone.slice(-4)}` : "***";
}

async function sendConfirmation(to: string, incidentId: string, severity: string, location: string | null) {
  const body = new URLSearchParams({
    username: process.env.AT_USERNAME ?? "",
    to,
    message: `Crisis Desk received your ${severity} report${location ? ` for ${location}` : ""}. Incident ${incidentId} is now open.`,
  });
  const senderId = process.env.AT_SMS_SENDER_ID;
  if (senderId) body.set("from", senderId);

  const response = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      Accept: "application/json",
      apiKey: process.env.AT_API_KEY ?? "",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) throw new Error(`Africa's Talking returned ${response.status}`);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const sender = String(form.get("from") ?? "").trim();
  const text = String(form.get("text") ?? "").trim();

  console.info("External inbound SMS received", { sender: maskPhone(sender), messageLength: text.length });

  if (!/^\+[1-9]\d{7,14}$/.test(sender) || !text || text.length > 500) {
    return new NextResponse("Invalid sender or message", { status: 400 });
  }

  try {
    const parsed = parseInboundSms(text);
    const db = getDb();
    const incidentReference = db.collection("incidents").doc();
    const activityReference = incidentReference.collection("activities").doc();
    const eventId = process.env.DEFAULT_EVENT_ID ?? "default-event";
    const batch = db.batch();

    batch.set(incidentReference, {
      ...parsed,
      status: "open",
      category: "Other",
      reportedBy: `sms:${sender}`,
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
      message: "Incident created via SMS.",
      actorId: `sms:${sender}`,
      metadata: { channel: "sms", sender: maskPhone(sender) },
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    let confirmation = "SMS confirmation sent";
    try {
      await sendConfirmation(sender, incidentReference.id, parsed.severity, parsed.location);
      console.info("External SMS confirmation accepted", { incidentId: incidentReference.id, recipient: maskPhone(sender) });
    } catch (error) {
      confirmation = "SMS confirmation failed";
      console.error("External SMS confirmation failed", { incidentId: incidentReference.id, error });
    }

    await incidentReference.collection("activities").add({
      incidentId: incidentReference.id,
      eventId,
      type: "commented",
      message: confirmation,
      actorId: `sms:${sender}`,
      metadata: { channel: "sms", recipient: maskPhone(sender) },
      createdAt: FieldValue.serverTimestamp(),
    });

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("External inbound SMS failed", { error });
    return new NextResponse("Unable to process SMS", { status: 500 });
  }
}