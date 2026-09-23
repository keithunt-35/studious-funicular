"use client";

// ============================================================
// LoginForm — components/auth/login-form.tsx
//
// Fully wired login form using:
//   - React Hook Form: manages form state & submission
//   - Zod: validates email/password before submission
//   - Firebase Auth: signInWithEmailAndPassword + Google
//   - useAuth context: reflects the new session app-wide
//
// FLOW:
//   User fills form → Zod validates → Firebase Auth →
//   AuthContext updates → middleware redirects to /dashboard
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { auth } from "@/lib/firebase";
import { ensureUserProfile } from "@/lib/firebase/user-helpers";
import { getFirebaseErrorMessage } from "@/lib/utils/firebase-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ── Zod Validation Schema ────────────────────────────────────
// Zod checks these rules BEFORE we ever call Firebase.
// This gives instant feedback without a network round-trip.
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

// TypeScript type inferred automatically from the schema
type LoginFormValues = z.infer<typeof loginSchema>;

// ── Component ────────────────────────────────────────────────
export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── React Hook Form setup ──────────────────────────────────
  // zodResolver connects our Zod schema to React Hook Form.
  // The form won't submit if validation fails.
  const {
    register,       // connects inputs to the form
    handleSubmit,   // wraps our submit handler with validation
    formState: { errors, isSubmitting }, // tracks errors & loading state
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // ── Email/Password Sign In ─────────────────────────────────
  // handleSubmit from RHF calls this ONLY if Zod validation passes
  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);

    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);

      // Success — show a brief toast then navigate
      // The middleware (Step 6) and AuthContext handle the rest
      toast.success("Welcome back!", { duration: 2000 });
      router.push("/dashboard");

    } catch (error: unknown) {
      // Extract Firebase error code and convert to friendly message
      const code = (error as { code?: string }).code ?? "";
      setFormError(getFirebaseErrorMessage(code));
    }
  };

  // ── Google Sign In ─────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setFormError(null);

    try {
      const provider = new GoogleAuthProvider();
      // Optional: force account chooser to appear every time
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Create Firestore profile if this is their first Google sign-in.
      // ensureUserProfile checks first — won't overwrite existing profiles.
      await ensureUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        displayName: firebaseUser.displayName ?? "User",
        photoURL: firebaseUser.photoURL,
      });

      toast.success("Welcome to Crisis Desk!", { duration: 2000 });
      router.push("/dashboard");

    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? "";
      // Don't show an error if the user simply closed the popup
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setFormError(getFirebaseErrorMessage(code));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // ── Derived state ──────────────────────────────────────────
  // Either form submission or Google is in progress
  const isAnyLoading = isSubmitting || isGoogleLoading;

  // ── Render ─────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

      {/* ── Form-level error banner ── */}
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* ── Email field ── */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
          disabled={isAnyLoading}
          className={cn("h-10", errors.email && "border-red-400 focus-visible:ring-red-400")}
          // register() connects this input to React Hook Form
          {...register("email")}
        />
        {/* Field-level validation error */}
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* ── Password field ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            tabIndex={isAnyLoading ? -1 : undefined}
          >
            Forgot password?
          </Link>
        </div>

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isAnyLoading}
            className={cn(
              "h-10 pr-10",
              errors.password && "border-red-400 focus-visible:ring-red-400"
            )}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={isAnyLoading}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "text-muted-foreground hover:text-foreground transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            )}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* ── Submit button ── */}
      <Button
        type="submit"
        className="w-full h-10 font-medium"
        disabled={isAnyLoading}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      {/* ── Divider ── */}
      <div className="relative flex items-center gap-3 py-1">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* ── Google Sign In ── */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-10"
        disabled={isAnyLoading}
        onClick={handleGoogleSignIn}
      >
        {isGoogleLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </>
        )}
      </Button>
    </form>
  );
}
