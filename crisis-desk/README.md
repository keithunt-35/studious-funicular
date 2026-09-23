# Crisis Desk

Crisis Desk is a real-time Event Emergency Room and Incident Command Center for event leads and department leads. Teams can report problems, assign responders, track progress, collaborate in comments, and resolve incidents while an event is live.

## Stack

- Next.js 16 App Router and TypeScript
- Tailwind CSS v4 with shadcn/ui-style components
- Firebase Authentication, Firestore, and Storage
- TanStack Query provider for future server state integrations
- React Hook Form and Zod
- Sonner notifications
- date-fns date formatting
- Lucide React icons

## Requirements

- Node.js 20 or newer
- npm
- A Firebase project with a Web App configured
- Firebase Authentication, Firestore, and Storage enabled

## Local Setup

From the project directory:

```bash
cd crisis-desk
npm install
cp .env.example .env.local
```

Open `.env.local` and add the Firebase Web App values from **Firebase Console > Project settings > Your apps > Web app**.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The server command must be run inside `crisis-desk`, where `package.json` is located.

## Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_DEFAULT_EVENT_ID=default-event
```

The Firebase browser configuration values are intended to be public. Access control is enforced by Firebase Authentication, Firestore Rules, and Storage Rules. Never put Firebase Admin credentials or service-account keys in `.env.local` or browser code.

`NEXT_PUBLIC_DEFAULT_EVENT_ID` identifies the event used by the current incident workflow. Event selection can replace this fallback when multi-event configuration is expanded.

## Available Commands

```bash
npm run dev       # Start local development
npm run lint      # Run ESLint
npm run build     # Create a production build
npm run start     # Serve the production build locally
```

## Routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/login` | Email/password and Google sign-in | Public |
| `/register` | Create a staff account | Public |
| `/dashboard` | Operations overview | Authenticated |
| `/incidents` | Real-time incident board | Authenticated |
| `/incidents/[id]` | Incident detail, status, comments, activity | Authenticated |
| `/team` | Team directory and workload overview | Authenticated |
| `/settings` | Event, notification, category, and role settings | Authenticated |

## Implemented Features

### Authentication

- Firebase email/password authentication
- Google sign-in
- Firestore user profiles
- Auth cookie used by the Next.js proxy for route protection
- Role-aware UI for event leads, department leads, and staff

### Incident Operations

- Real-time Firestore incident listeners
- Search and filters for severity, status, category, and assignee
- New incident form with Zod validation
- Optional incident photo upload to Firebase Storage
- Incident detail page with live status updates
- Assignment and reassignment
- Resolution notes
- Activity timeline
- Real-time team comments

### Team and Settings

- Real-time active team directory
- Workload counts and unassigned incident count
- Event configuration and custom incident categories
- User notification preferences
- Event-lead role management
- Light/dark theme support
- Responsive desktop and mobile navigation

## Firebase Data Model

```text
/users/{uid}
  /notificationPreferences/default

/events/{eventId}

/incidents/{incidentId}
  /activities/{activityId}
  /comments/{commentId}
```

The canonical TypeScript contracts are in `types/index.ts`. Firestore access is centralized in `lib/firebase/`.

## Firebase Configuration and Deployment

Firebase deployment files are included:

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`

Install the Firebase CLI if necessary, authenticate, and select the correct project:

```bash
npm install -g firebase-tools
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
```

Deploy Firestore and Storage configuration from the `crisis-desk` directory:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Before deploying, review the rules against your organization’s policy. The rules currently allow authenticated users to read operational data, restrict event settings and role changes to event leads, and limit incident photos to authenticated image uploads under 10 MB.

## Role Model

| Role | Capabilities |
| --- | --- |
| Event Lead | Manage event settings, roles, incidents, and team oversight |
| Department Lead | View team data and manage operational incident responses |
| Staff | Report incidents, comment, and manage personal notification preferences |

New accounts are created as `staff`. Promotion is performed by an event lead.

## Africa’s Talking Readiness

Notification preferences already include SMS support and are stored in Firestore. Africa’s Talking integration should be implemented through Firebase Cloud Functions so API credentials remain server-side.

The Cloud Functions work is intentionally not included in this web client handover. The future function should listen for relevant incident changes, check notification preferences, and send SMS through Africa’s Talking using server-side secrets.

## Production Checklist

1. Create and configure the production Firebase project.
2. Enable the required Firebase Authentication providers.
3. Create Firestore and Storage databases.
4. Deploy and review `firestore.rules` and `storage.rules`.
5. Add all `NEXT_PUBLIC_*` variables to the hosting provider.
6. Set `NEXT_PUBLIC_DEFAULT_EVENT_ID` to the production event document ID.
7. Create an event-lead account and verify role permissions.
8. Test incident creation, photo upload, assignment, comments, resolution, and sign out.
9. Add Cloud Functions for Africa’s Talking notifications before enabling SMS alerts in production.

## Validation

The current project validates with:

```bash
npm run lint
npm run build
```

The application currently has no automated browser test suite. Manual verification should cover authenticated and unauthenticated routes, all role levels, mobile navigation, reduced-motion behavior, Firebase permission failures, and offline/error states.

## Project Structure

```text
app/                    Next.js routes and layouts
components/             UI, authentication, incidents, team, settings
constants/              Shared labels, severity, status, and collection names
lib/firebase/            Firebase services, paths, converters, and helpers
lib/hooks/               Authentication and route guard hooks
types/                   Shared TypeScript domain contracts
public/                 Static assets
firestore.rules         Firestore authorization rules
storage.rules           Firebase Storage authorization rules
```