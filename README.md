# Crisis Desk

**Real-time Event Emergency Room & Incident Command Center**

Crisis Desk helps event teams respond quickly and calmly when things go wrong during live events — missing speakers, broken microphones, delayed catering, VIP issues, power failures, and more.

Field staff report problems. Event leads and department leads assign responders, track progress, collaborate in real time, and resolve incidents — all while protecting the guest experience.

This repository contains the full Crisis Desk platform:

| Component | Description |
|-----------|-------------|
| **Web Command Center** | Next.js dashboard for Event Leads and supervisors |
| **Mobile App** | Android app (submodule) for field staff |
| **Lifeline (Cloud Functions)** | Africa's Talking integration for SMS, USSD, Voice, and Airtime |

---

## Why Crisis Desk?

Most event tools focus on registration and agendas. Crisis Desk focuses on the moment things break:

- Log incidents in seconds
- Real-time updates across web and mobile
- Role-based views (Event Lead, Department Lead, Staff)
- Works even when smartphones fail — via SMS and USSD (Africa's Talking)
- Automated voice alerts for critical incidents
- Optional airtime rewards for resolvers

Inspired by real-world event management lessons: *Expect the unexpected. Stay calm. Protect the guest experience.*

---

## Repository Structure

```text
studious-funicular/
├── README.md                 ← You are here
└── crisis-desk/              ← Main application
    ├── app/                  ← Next.js App Router (web)
    ├── components/           ← UI components
    ├── lib/                  ← Firebase helpers, hooks
    ├── types/                ← Shared TypeScript types
    ├── functions/            ← Firebase Cloud Functions (Africa's Talking)
    ├── crisisDeskMobile/     ← Android app (git submodule)
    ├── firestore.rules
    ├── storage.rules
    ├── firebase.json
    └── README.md             ← Detailed web app docs
```

---

## Tech Stack

### Web Command Center
- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui-style components
- **Backend:** Firebase Authentication, Firestore, Storage
- **Forms:** React Hook Form + Zod
- **State:** TanStack Query + Firebase real-time listeners
- **UI:** Lucide icons, Sonner toasts, date-fns

### Mobile
- Native Android (Kotlin + Jetpack Compose) — see `crisis-desk/crisisDeskMobile`

### Lifeline (Server)
- Firebase Cloud Functions (Node.js)
- Africa's Talking APIs: SMS (inbound + outbound), USSD, Voice, Airtime
- Secrets managed via Firebase Secret Manager (never in source code)

---

## Quick Start (Web App)

### Prerequisites
- Node.js 20 or newer
- npm
- A Firebase project with Authentication, Firestore, and Storage enabled
- (Optional) Firebase CLI for deploying rules and functions

### 1. Clone the repository

```bash
git clone https://github.com/keithunt-35/studious-funicular.git
cd studious-funicular/crisis-desk
```

If the mobile submodule is empty:

```bash
git submodule update --init --recursive
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your **Firebase Web App** values from:

**Firebase Console → Project settings → Your apps → Web app**

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_DEFAULT_EVENT_ID=default-event
```

> These `NEXT_PUBLIC_*` values are safe for the browser. Never put Admin SDK keys or Africa's Talking secrets in `.env.local`.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Main Routes (Web)

| Route | Purpose | Access |
|-------|---------|--------|
| `/login` | Email/password & Google sign-in | Public |
| `/register` | Create a staff account | Public |
| `/dashboard` | Operations overview | Authenticated |
| `/incidents` | Real-time incident board | Authenticated |
| `/incidents/[id]` | Detail, status, comments, timeline | Authenticated |
| `/team` | Team directory & workload | Authenticated |
| `/settings` | Event, categories, roles, notifications | Authenticated |

---

## Core Features

### Authentication & Roles
- Firebase email/password + Google sign-in
- Roles: **Event Lead**, **Department Lead**, **Staff**
- New accounts start as Staff; Event Leads can promote users

### Incident Management
- Create incidents with category, severity, description, optional photo
- Real-time board with filters (severity, status, category, assignee)
- Assignment, status changes, resolution notes
- Live activity timeline and team comments

### Team & Settings
- Live team directory and workload counts
- Custom incident categories
- Notification preferences
- Light / dark theme

### Crisis Desk Lifeline (Africa's Talking)
Server-side only (Cloud Functions):

- **Inbound SMS** — Field staff text a shortcode; system creates an incident
- **USSD menus** — Feature-phone users dial a code to report emergencies or check tasks
- **Voice alerts** — Critical incidents trigger automated calls to Event Leads
- **Airtime rewards** — Optional micro-rewards when Critical incidents are resolved

See detailed setup and testing guides:

- [`crisis-desk/functions/README.md`](crisis-desk/functions/README.md)
- [`crisis-desk/functions/LIFELINE_TESTING.md`](crisis-desk/functions/LIFELINE_TESTING.md)

---

## Firebase Setup & Deployment

From the `crisis-desk` directory:

```bash
npm install -g firebase-tools
firebase login
firebase use YOUR_FIREBASE_PROJECT_ID
```

Deploy security rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Deploy Cloud Functions (after configuring secrets — see functions README):

```bash
firebase deploy --only functions
```

---

## Available Scripts (Web)

```bash
npm run dev       # Local development
npm run lint      # ESLint
npm run build     # Production build
npm run start     # Serve production build
```

---

## Data Model (High Level)

```text
/users/{uid}
/events/{eventId}
/incidents/{incidentId}
  /activities/{activityId}
  /comments/{commentId}
```

Full TypeScript contracts live in `crisis-desk/types/`.

---

## Security Notes

- No API keys or secrets are committed to this repository.
- Africa's Talking credentials must be stored with Firebase Secret Manager.
- Firebase Admin / service-account keys must never be placed in client code or public env files.
- Review `firestore.rules` and `storage.rules` before production use.

---

## Production Checklist

1. Create a production Firebase project.
2. Enable Authentication providers (Email + Google recommended).
3. Create Firestore and Storage.
4. Deploy and review security rules.
5. Set all `NEXT_PUBLIC_*` variables on your hosting platform.
6. Set `NEXT_PUBLIC_DEFAULT_EVENT_ID` to your real event document ID.
7. Create an Event Lead account and verify permissions.
8. Test full incident lifecycle (create → assign → comment → resolve).
9. Configure and test Africa's Talking Lifeline features via Cloud Functions before enabling SMS/Voice in production.

---

## Documentation Map

| Document | Location |
|----------|----------|
| Web app setup & features | [`crisis-desk/README.md`](crisis-desk/README.md) |
| Cloud Functions & Africa's Talking | [`crisis-desk/functions/README.md`](crisis-desk/functions/README.md) |
| Lifeline testing guide | [`crisis-desk/functions/LIFELINE_TESTING.md`](crisis-desk/functions/LIFELINE_TESTING.md) |
| Mobile app | `crisis-desk/crisisDeskMobile/` (see its own README if present) |

---

## License

This project is private / unpublished unless otherwise stated by the repository owner.

---

## Acknowledgments

Built for real-world event operations — where preparation, calm decision-making, and reliable communication matter most.
