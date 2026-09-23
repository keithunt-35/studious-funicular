// ============================================================
// Root Page — app/page.tsx
//
// The root "/" route simply redirects to the login page.
// Once authentication is built (Step 2), this will check
// if the user is already logged in and redirect to /dashboard.
// ============================================================

import { redirect } from "next/navigation";

export default function RootPage() {
  // For now, always send visitors to the login page.
  // Step 2 will add: if (user) redirect("/dashboard")
  redirect("/login");
}
