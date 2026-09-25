# Crisis Desk Functions

These Firebase Cloud Functions contain the server-side Africa's Talking integration.
The web app must never receive the Africa's Talking API key.

For the complete Sandbox checklist, webhook table, event-day instructions, and final feature summary, see [LIFELINE_TESTING.md](./LIFELINE_TESTING.md).

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

6. Configure the non-secret parameters in a project-specific Functions dotenv file. Replace `<project-id>` with the Firebase project ID:

   ```bash
   cp functions/.env.example functions/.env.<project-id>
   ```

   Edit `functions/.env.<project-id>` and set `DEFAULT_EVENT_ID`, `AT_VOICE_CALLER_ID`, and the channel flags. This file is ignored by git. The Firebase CLI also prompts for missing parameter values during deployment and stores them in this file.

7. Deploy the test function:

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

Runtime switches are available for event-day control. Set `AT_SMS_ENABLED`, `AT_USSD_ENABLED`, or `AT_VOICE_ENABLED` to `false` to stop that channel without removing the deployed function. `AT_AIRTIME_REWARDS_ENABLED` is also `false` by default and controls reward transfers.

## Inbound SMS webhook

The deployed webhook is:

```text
https://us-central1-<your-firebase-project-id>.cloudfunctions.net/inboundSms
```

Configure this URL as the incoming SMS callback URL in the Africa's Talking Sandbox two-way SMS settings. Set `DEFAULT_EVENT_ID` to the Firestore event document that should receive SMS reports. For local emulator work, copy `.env.example` to `.env` and adjust the value.

Africa's Talking sends form fields including `from` and `text`. A message such as:

```text
CRITICAL Power failure in Main Hall
```

creates an open Critical incident, uses `Main Hall` as the location, adds a timeline entry identifying the sender, and attempts a confirmation SMS. The incident is retained even when the confirmation SMS fails.

For a local HTTP smoke test, send the same form shape to the emulator URL:

```bash
curl -X POST http://127.0.0.1:5001/<your-firebase-project-id>/us-central1/inboundSms \
   -H 'Content-Type: application/x-www-form-urlencoded' \
   --data-urlencode 'from=+254700000000' \
   --data-urlencode 'text=CRITICAL Power failure in Main Hall'
```

## USSD webhook

Deploy the USSD function with:

```bash
firebase deploy --only functions:ussd
```

Configure this callback URL in the Africa's Talking Sandbox USSD application:

```text
https://us-central1-<your-firebase-project-id>.cloudfunctions.net/ussd
```

The menu uses `CON` while collecting input and `END` when the session is complete. It supports reporting an emergency, viewing up to three open assigned tasks, and a short help response. A caller must have the same international phone number saved in their Crisis Desk profile before assigned tasks can be displayed.

For a local emulator smoke test, send the cumulative USSD input values that Africa's Talking sends during one session:

```bash
USSD_URL="http://127.0.0.1:5001/<your-firebase-project-id>/us-central1/ussd"

curl -X POST "$USSD_URL" -d 'sessionId=test-1' -d 'phoneNumber=+254700000000' -d 'text='
curl -X POST "$USSD_URL" -d 'sessionId=test-1' -d 'phoneNumber=+254700000000' -d 'text=1'
curl -X POST "$USSD_URL" -d 'sessionId=test-1' -d 'phoneNumber=+254700000000' -d 'text=1*1'
curl -X POST "$USSD_URL" -d 'sessionId=test-1' -d 'phoneNumber=+254700000000' -d 'text=1*1*Power failure at Gate 2'
```

## Voice API

Set the Africa's Talking virtual voice number used as the caller ID:

```bash
# Edit functions/.env.<project-id> and set AT_VOICE_CALLER_ID first.
```

Deploy the trigger and voice callback:

```bash
firebase deploy --only functions:callEventLeadsForCriticalIncident,functions:voiceInstructions
```

Configure the Africa's Talking Voice callback URL as:

```text
https://us-central1-<your-firebase-project-id>.cloudfunctions.net/voiceInstructions
```

When a newly created incident has `severity: critical`, the trigger calls every active Event Lead with a phone number. The callback returns text-to-speech instructions containing the incident description. Each requested or failed call is recorded in the incident activity timeline.

## Airtime rewards

Rewards are disabled by default. Configure them before deployment:

```bash
# Edit functions/.env.<project-id> and set the Airtime values first.
```

Example values are `true`, `50`, and `KES`. For Uganda, use `true`, `1000`, and `UGX`. Deploy the reward trigger with:

```bash
firebase deploy --only functions:rewardCriticalIncidentResolver
```

When a Critical incident changes to `resolved`, the function finds `resolvedBy`, reads that user's phone number, and sends one airtime reward through Africa's Talking. The reward is claimed by incident ID before the provider request, so retries cannot pay twice. Missing phone numbers, invalid configuration, disabled rewards, successful requests, and failures are all logged in the incident timeline.

## Step 6 safety notes

- Credentials are read from Firebase Secret Manager only; no API key or username is stored in source files.
- Webhooks require POST requests, international phone numbers, bounded message/session input, and return safe generic errors.
- Voice calls and airtime rewards use Firestore claim records to avoid duplicate provider actions when a Cloud Function is retried.
- SMS confirmation failures do not undo a saved incident. Voice and airtime failures are logged and do not undo the incident status change.
- Provider actions are logged under the related incident activity timeline with channel and status metadata.