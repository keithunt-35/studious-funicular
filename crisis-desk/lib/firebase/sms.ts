import { getFunctions, httpsCallable } from "firebase/functions";

import app from "./config";

type NotifySmsResponse = {
  ok: boolean;
  message: string;
  providerResponse?: unknown;
};

export async function notifySMS(
  to: string,
  message: string,
): Promise<NotifySmsResponse | null> {
  try {
    const functions = getFunctions(app);
    const sendTestSms = httpsCallable<
      { phoneNumber: string; message: string },
      NotifySmsResponse
    >(functions, "sendTestSms");
    const result = await sendTestSms({ phoneNumber: to, message });

    console.log("SMS CLIENT RESPONSE:", result.data);
    return result.data;
  } catch (error) {
    console.error("SMS CLIENT ERROR:", error);
    return null;
  }
}
