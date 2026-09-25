import africastalking from "africastalking";
import { defineSecret, defineString } from "firebase-functions/params";

// Secret values are read only when a function runs, never during deployment.
const africaTalkingUsername = defineSecret("AT_USERNAME");
const africaTalkingApiKey = defineSecret("AT_API_KEY");
const voiceCallerId = defineString("AT_VOICE_CALLER_ID", { default: "" });

function getAfricaTalkingClient() {
  const username = africaTalkingUsername.value();
  const apiKey = africaTalkingApiKey.value();

  if (!username || !apiKey) {
    throw new Error(
      "Africa's Talking credentials are missing. Set AT_USERNAME and AT_API_KEY."
    );
  }

  return africastalking({ username, apiKey });
}

async function sendSms({ to, message }) {
  const client = getAfricaTalkingClient();
  const senderId = process.env.AT_SMS_SENDER_ID;

  return client.SMS.send({
    to,
    message,
    ...(senderId ? { from: senderId } : {}),
  });
}

async function sendVoiceCall({ to, clientRequestId }) {
  const callerId = voiceCallerId.value();

  if (!callerId) {
    throw new Error("AT_VOICE_CALLER_ID is missing.");
  }

  const client = getAfricaTalkingClient();
  return client.VOICE.call({
    callFrom: callerId,
    callTo: to,
    clientRequestId,
  });
}

function buildVoiceInstructions(message) {
  const client = getAfricaTalkingClient();
  const escapedMessage = message
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

  return new client.VOICE.ActionBuilder()
    .say(escapedMessage, { voice: "woman", playBeep: false })
    .build();
}

export {
  africaTalkingApiKey,
  africaTalkingUsername,
  buildVoiceInstructions,
  sendVoiceCall,
  sendSms,
};