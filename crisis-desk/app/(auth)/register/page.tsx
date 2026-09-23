// ============================================================
// Register Page — app/(auth)/register/page.tsx
//
// Skeleton UI for the account creation form.
// Step 2 will wire up real Firebase auth here.
// ============================================================

import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Create an account
        </h2>
        <p className="text-sm text-muted-foreground">
          Set up your Crisis Desk workspace
        </p>
      </div>

      {/* Register form component */}
      <RegisterForm />

      {/* Login link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
