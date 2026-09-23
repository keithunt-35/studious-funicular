// ============================================================
// Root Page — app/page.tsx
//
// The root "/" route simply redirects to the login page.
// Once authentication is built (Step 2), this will check
// if the user is already logged in and redirect to /dashboard.
// ============================================================

import { redirect } from "next/navigation";

export default function RootPage() {
  // The proxy checks the lightweight auth cookie and chooses the destination.
  // Keep the server-rendered root deterministic; the proxy handles auth-aware routing.
  redirect("/login");
}
