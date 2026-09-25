# Crisis Desk Functions

These Firebase Cloud Functions contain the server-side Africa's Talking integration.
The web app must never receive the Africa's Talking API key.

## Step 1 setup

1. Create an account at [Africa's Talking](https://africastalking.com/) and open the **Sandbox** environment.
2. Copy the sandbox username from the dashboard. In the sandbox this is commonly `sandbox`.
3. Generate or copy the sandbox API key from the dashboard. Treat it like a password.
4. From this directory, install dependencies:

   ```bash
   npm install
   ```

5. From the project root, store the credentials in Firebase Secret Manager:

   ```bash
   firebase functions:secrets:set AT_USERNAME
   firebase functions:secrets:set AT_API_KEY
   ```

   Paste each value only when the Firebase CLI prompts for it. Do not put either value in source code or commit it to git.

6. Deploy the test function:

   ```bash
   firebase deploy --only functions:sendTestSms
   ```

## Testing

Call `sendTestSms` from an authenticated Crisis Desk client with:

```js
{
  phoneNumber: "+254700000000",
  message: "Crisis Desk sandbox SMS test"
}
```

Use a phone number registered as a test recipient in the Africa's Talking sandbox. The function rejects unauthenticated calls and does not expose the API key in its response.

`AT_SMS_SENDER_ID` is optional. Leave it empty unless the Africa's Talking dashboard gives the sandbox a sender ID to use.