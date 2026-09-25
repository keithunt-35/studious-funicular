# Crisis Desk Lifeline Testing and Operations

This is the Step 7 runbook for the Africa's Talking integration. Use the Sandbox first. Do not enable Airtime Rewards in production until a small sandbox transfer has been verified and approved.

## 1. Prerequisites

- Firebase CLI authenticated and pointed at the intended project:

  ```bash
  firebase login
  firebase use <your-firebase-project-id>
  ```

The current workspace does not have the Firebase CLI installed or a `.firebaserc` project alias yet. Complete this first from the `crisis-desk` directory:

```bash
npm install --global firebase-tools
firebase --version
firebase login
firebase projects:list
firebase use --add
```

Choose the Firebase project that already contains this Crisis Desk Firestore database. If global npm installation is not available, use `npx firebase-tools@latest` in place of `firebase` for each command.

- Africa's Talking account with a Sandbox application.
- Africa's Talking Sandbox API key and username. The Sandbox username is normally `sandbox`.
- A registered Sandbox test recipient phone number.
- A Firestore event document ID for `DEFAULT_EVENT_ID`.
- At least one active Crisis Desk Event Lead with an international phone number for Voice testing.
- The Functions dependencies installed:

  ```bash
  cd functions
  npm install
  ```

## 2. Secrets and Parameters

Store credentials as Firebase secrets. Never add them to `.env.local`, source code, or git:

```bash
firebase functions:secrets:set AT_USERNAME
firebase functions:secrets:set AT_API_KEY
```

Set the non-secret parameters in a project-specific dotenv file. Replace `<project-id>` with the Firebase project ID:

```bash
cp functions/.env.example functions/.env.<project-id>
```

Edit `functions/.env.<project-id>` with the values below. Firebase parameter values are loaded from this file during deployment. If a value is missing, the Firebase CLI prompts for it during `firebase deploy` and writes the answer to this file. Do not use `firebase functions:params:set`; parameterized Functions use dotenv files and deploy-time prompts.

Recommended Sandbox values:

```text
DEFAULT_EVENT_ID=<existing-firestore-event-id>
AT_SMS_ENABLED=true
AT_USSD_ENABLED=true
AT_VOICE_ENABLED=true
AT_VOICE_CALLER_ID=<Africa's Talking virtual voice number>
AT_AIRTIME_REWARDS_ENABLED=false
AT_AIRTIME_REWARD_AMOUNT=50
AT_AIRTIME_REWARD_CURRENCY=KES
```

## 3. Webhook URLs

After deployment, replace `<project-id>` with the Firebase project ID:

| Feature | Function | Africa's Talking setting | URL |
| --- | --- | --- | --- |
| Inbound SMS | `inboundSms` | Two-way SMS incoming callback | `https://us-central1-<project-id>.cloudfunctions.net/inboundSms` |
| USSD | `ussd` | USSD service callback | `https://us-central1-<project-id>.cloudfunctions.net/ussd` |
| Voice | `voiceInstructions` | Voice callback / application URL | `https://us-central1-<project-id>.cloudfunctions.net/voiceInstructions` |
| Airtime | No callback required | API request from the resolution trigger | Not applicable |

Deploy all current Lifeline functions with:

```bash
firebase deploy --only functions:inboundSms,functions:ussd,functions:voiceInstructions,functions:callEventLeadsForCriticalIncident,functions:rewardCriticalIncidentResolver
```

The authenticated `sendTestSms` callable is a setup check and is not an Africa's Talking webhook.

## 4. Automated and Local Checks

Run these before every deployment:

```bash
cd functions
npm test
cd ..
npm run lint
npm run build
```

The Functions tests cover severity parsing, USSD navigation, Voice message construction, reward gating, feature flags, and phone validation.

For local webhook checks, start the Firebase Emulator Suite with the Functions and Firestore emulators enabled, then use the commands in `functions/README.md`:

- SMS: submit `from=+254700000000` and `text=CRITICAL Power failure in Main Hall`.
- USSD: submit the cumulative values ``, `1`, `1*1`, and `1*1*Power failure at Gate 2` using one `sessionId`.
- Voice callback: POST a `clientRequestId` for a seeded `voiceCalls` document and verify the XML contains `<Response>` and `<Say>`.
- Airtime: keep the reward flag false in local development unless a controlled provider test is intentional.

## 5. Sandbox Checklist

### Inbound SMS

1. Configure the `inboundSms` URL in Africa's Talking Two-way SMS settings.
2. Confirm the sender phone is allowed by the Sandbox.
3. Send: `CRITICAL Power failure in Main Hall`.
4. Confirm the sender receives a confirmation SMS.
5. Confirm Firestore contains an open incident with:
   - `severity: critical`
   - `location: Main Hall`
   - `reportedBy: sms:+<sender-number>`
6. Confirm the incident timeline contains the SMS sender and confirmation status.
7. Repeat the message only when intentionally testing duplicate behavior; inspect whether the provider supplies a message ID before relying on retry deduplication.

### USSD

1. Configure the `ussd` URL in the Africa's Talking Sandbox USSD application.
2. Dial the Sandbox USSD code from a registered test phone.
3. Select `1. Report Emergency`, choose a severity, and submit a short description.
4. Confirm the session ends with a receipt and incident ID.
5. Confirm the Firestore incident has `reportedBy: ussd:+<phone-number>` and a creation timeline entry.
6. Assign an incident to a user whose profile phone exactly matches the dialing number.
7. Select `2. My Assigned Tasks` and confirm open and in-progress assignments are listed.
8. Select `3. Help` and confirm the session ends quickly.

### Voice

1. Ensure an active Event Lead has an international phone number in the `users` collection.
2. Configure the Voice callback URL and set `AT_VOICE_CALLER_ID` to the Africa's Talking virtual number.
3. Create a new Critical incident in the dashboard or through SMS/USSD.
4. Confirm the Event Lead receives the call.
5. Confirm the spoken message includes the incident category, location when present, description, and command-center instruction.
6. Confirm the incident timeline records the call as requested or failed.
7. Confirm one `voiceCalls/{incidentId}_{leadUid}` record exists and a function retry does not create a second request.

### Airtime Rewards

1. Keep `AT_AIRTIME_REWARDS_ENABLED=false` until SMS, USSD, and Voice are stable.
2. Use a small approved Sandbox amount, for example `50 KES`.
3. Set the flag to `true`, configure amount/currency, and deploy `rewardCriticalIncidentResolver`.
4. Resolve a newly created Critical incident as a user with a registered phone number.
5. Confirm one `airtimeRewards/{incidentId}` record is created.
6. Confirm the provider response and timeline status are recorded.
7. Confirm a retry does not send a second reward.
8. Set the flag back to `false` after testing.

## 6. Event-Day Usage

Field staff can send a normal SMS to the configured virtual number:

```text
CRITICAL Power failure in Main Hall
HIGH Medical assistance near Gate 2
MEDIUM Missing registration supplies at Check-in
```

Keep the message short. Include the severity first and a clear location when possible. The dashboard team should monitor the resulting incident, assign a responder, and keep updates in the incident timeline.

Volunteers without data can dial the configured USSD code:

1. Choose `Report Emergency`.
2. Choose the severity.
3. Enter one short description.

To see assigned work, choose `My Assigned Tasks`. USSD sessions are deliberately brief; use SMS for longer context.

If a channel is unstable, an Event Lead can disable it with its runtime flag without deleting the deployed function:

```bash
# Edit functions/.env.<project-id>, set the selected flag to false, then redeploy.
firebase deploy --only functions
```

## 7. Final Summary

The Crisis Desk Lifeline now includes:

- Inbound SMS incident creation with severity and location parsing.
- USSD emergency reporting, assigned-task lookup, and help.
- Critical-incident Voice calls to active Event Leads with text-to-speech.
- Configurable Airtime Rewards after a Critical incident is resolved.
- Firestore timeline logging for provider actions and failures.
- Secret Manager credentials, runtime channel flags, bounded webhook inputs, and idempotency records for Voice and Airtime.
- Automated parser and safety tests plus the existing dashboard lint and production build checks.

Before production, complete the Sandbox checklist, review Firestore and Functions logs, confirm the Event Lead contact list, and obtain approval for Airtime Rewards and provider billing.
