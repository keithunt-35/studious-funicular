// ============================================================
// Login Page — app/(auth)/login/page.tsx
//
// This is the skeleton UI for the login form.
// Right now it's purely visual — no real auth logic yet.
// Step 2 will wire up Firebase Authentication here.
//
// Features:
//   - Email / password fields (visually complete)
//   - "Remember me" checkbox
//   - Link to register page
//   - Placeholder submit button
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground">
          Sign in to your Crisis Desk account
        </p>
      </div>

      {/* Login form component */}
      <LoginForm />

      {/* Register link */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
