"use client";

// ============================================================
// DashboardPlaceholder — components/auth/dashboard-placeholder.tsx
//
// Temporary authenticated landing page for Step 2.
// Proves the entire auth system works correctly.
// Will be replaced by the real dashboard in Step 5.
// ============================================================

import { useAuthGuard } from "@/lib/hooks/use-auth-guard";
import { PageLoader } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  User,
  Mail,
  Tag,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/firebase/auth-context";
import { USER_ROLES } from "@/constants";

export function DashboardPlaceholder() {
  // useAuthGuard handles the redirect if the user is not logged in.
  // While Firebase is confirming auth state, loading is true.
  const { userProfile, loading } = useAuthGuard();
  const { signOut } = useAuth();

  // ── Loading state ──────────────────────────────────────────
  // Show a full-page spinner while Firebase confirms auth.
  // This prevents a flash of content before we know who's logged in.
  if (loading) {
    return <PageLoader />;
  }

  // After useAuthGuard runs and loading is false, userProfile
  // is guaranteed to be non-null (hook redirects if null)
  if (!userProfile) return null;

  // ── Sign out handler ───────────────────────────────────────
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      // The proxy + auth cookie cleared = redirect handled automatically
    } catch {
      toast.error("Sign out failed. Please try again.");
    }
  };

  // ── Role badge color ───────────────────────────────────────
  const roleLabel = USER_ROLES[userProfile.role] ?? userProfile.role;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">

      {/* ── Minimal top bar ── */}
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-foreground tracking-tight">
              Crisis Desk
            </span>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Step 2 Preview
            </Badge>
          </div>

          {/* Sign out */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-4xl px-6 py-12 space-y-8">

        {/* ── Success banner ── */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="font-semibold text-emerald-800 dark:text-emerald-300">
                Authentication working ✓
              </h2>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                You are authenticated and this protected route loaded successfully.
                The full dashboard UI will be built in Step 3.
              </p>
            </div>
          </div>
        </div>

        {/* ── User profile card ── */}
        <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <User className="h-4 w-4" />
            Logged-in User
          </h3>

          <div className="space-y-3">
            {/* Display name */}
            <div className="flex items-center gap-3">
              {/* Avatar initials */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                {userProfile.displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {userProfile.displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  UID: {userProfile.uid.slice(0, 12)}...
                </p>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Email */}
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-foreground">{userProfile.email}</span>
            </div>

            {/* Role */}
            <div className="flex items-center gap-3 text-sm">
              <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Role:</span>
              <Badge variant="secondary" className="font-medium">
                {roleLabel}
              </Badge>
            </div>

            {/* Account created */}
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Joined:</span>
              <span className="text-foreground">
                {userProfile.createdAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* ── Auth system checklist ── */}
        <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Activity className="h-4 w-4" />
            Step 2 Checklist
          </h3>

          <ul className="space-y-2.5">
            {[
              "Firebase Authentication initialized",
              "AuthContext + useAuth hook active",
              "Firestore UserProfile created on register",
              "Email/password login working",
              "Google Sign-in wired up",
              "React Hook Form + Zod validation on login",
              "React Hook Form + Zod validation on register",
              "Password strength indicator on register",
              "Friendly Firebase error messages",
              "Auth cookie set on login (crisis-desk-auth)",
              "Next.js proxy guarding protected routes",
              "useAuthGuard() protecting this page",
              "Sign-out clears session + redirects to /login",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── What's next banner ── */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-semibold">Next up — Step 3:</span> The real
              authenticated layout with a full sidebar navigation, topbar with
              user profile dropdown, and dark/light mode support.
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
