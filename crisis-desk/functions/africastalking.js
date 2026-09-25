import africastalking from "africastalking";
import { defineSecret } from "firebase-functions/params";

// Secret values are read only when a function runs, never during deployment.
const africaTalkingUsername = defineSecret("AT_USERNAME");
const africaTalkingApiKey = defineSecret("AT_API_KEY");

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

export {
  africaTalkingApiKey,
  africaTalkingUsername,
  sendSms,
};