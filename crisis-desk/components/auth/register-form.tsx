"use client";

// ============================================================
// RegisterForm — components/auth/register-form.tsx
//
// Fully wired registration form using:
//   - React Hook Form: form state management
//   - Zod: multi-field validation (name, email, password,
//          confirm password, password strength)
//   - Firebase Auth: createUserWithEmailAndPassword +
//                    updateProfile (sets displayName)
//   - Firestore: createUserProfile (saves role, etc.)
//
// FLOW:
//   User fills form → Zod validates → Firebase creates account
//   → updateProfile sets display name → createUserProfile
//   saves Firestore doc → AuthContext picks up new session
//   → redirect to /dashboard
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { auth } from "@/lib/firebase";
import { createUserProfile } from "@/lib/firebase/user-helpers";
import { getFirebaseErrorMessage } from "@/lib/utils/firebase-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ── Zod Validation Schema ────────────────────────────────────
const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Name must be at least 2 characters")
      .max(60, "Name is too long")
      // Only letters, spaces, hyphens, apostrophes
      .regex(/^[a-zA-Z\s'\-]+$/, "Name can only contain letters and spaces"),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),

    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter")
      .regex(/[0-9]/, "Password must include at least one number"),

    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  // Cross-field validation: passwords must match
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // error attaches to this field
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ── Password strength indicator helper ──────────────────────
// Returns 0–4 based on how many rules are satisfied
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  checks: { label: string; passed: boolean }[];
} {
  const checks = [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "One uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "One number", passed: /[0-9]/.test(password) },
    { label: "One special character", passed: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.passed).length;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "",
    "text-red-500",
    "text-amber-500",
    "text-yellow-500",
    "text-emerald-600",
  ];

  return { score, label: labels[score] ?? "", color: colors[score] ?? "", checks };
}

// ── Component ────────────────────────────────────────────────
export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Watch the password field in real-time to show strength indicator
  const passwordValue = useWatch({ control, name: "password", defaultValue: "" });
  const strength = getPasswordStrength(passwordValue);

  // ── Submit handler ─────────────────────────────────────────
  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);

    try {
      // Step 1: Create the Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const firebaseUser = userCredential.user;

      // Step 2: Set the display name on the Firebase Auth profile
      // This makes firebaseUser.displayName available immediately
      await updateProfile(firebaseUser, {
        displayName: values.displayName,
      });

      // Step 3: Create the Firestore user profile document
      // This is what the rest of the app reads (role, department, etc.)
      await createUserProfile({
        uid: firebaseUser.uid,
        email: values.email,
        displayName: values.displayName,
        photoURL: null,
        role: "staff", // Default role — can be changed by event_lead later
      });

      // Step 4: Celebrate and redirect
      toast.success("Account created! Welcome to Crisis Desk.", {
        duration: 3000,
      });
      router.push("/dashboard");

    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? "";
      setFormError(getFirebaseErrorMessage(code));
    }
  };

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

      {/* ── Full name ── */}
      <div className="space-y-1.5">
        <Label htmlFor="displayName" className="text-sm font-medium">
          Full name
        </Label>
        <Input
          id="displayName"
          type="text"
          placeholder="Jane Smith"
          autoComplete="name"
          autoFocus
          disabled={isSubmitting}
          className={cn(
            "h-10",
            errors.displayName && "border-red-400 focus-visible:ring-red-400"
          )}
          {...register("displayName")}
        />
        {errors.displayName && (
          <p className="text-xs text-red-600">{errors.displayName.message}</p>
        )}
      </div>

      {/* ── Email ── */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isSubmitting}
          className={cn(
            "h-10",
            errors.email && "border-red-400 focus-visible:ring-red-400"
          )}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* ── Password ── */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            disabled={isSubmitting}
            className={cn(
              "h-10 pr-10",
              errors.password && "border-red-400 focus-visible:ring-red-400"
            )}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={isSubmitting}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "text-muted-foreground hover:text-foreground transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            )}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}

        {/* ── Password strength indicator ── */}
        {passwordValue.length > 0 && (
          <div className="space-y-2 pt-1">
            {/* Strength bar */}
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-300",
                    strength.score >= level
                      ? level === 1
                        ? "bg-red-400"
                        : level === 2
                        ? "bg-amber-400"
                        : level === 3
                        ? "bg-yellow-400"
                        : "bg-emerald-500"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
            {/* Strength label */}
            <p className={cn("text-xs font-medium", strength.color)}>
              {strength.label}
            </p>
            {/* Individual checks */}
            <ul className="space-y-1">
              {strength.checks.map((check) => (
                <li
                  key={check.label}
                  className={cn(
                    "flex items-center gap-1.5 text-xs transition-colors",
                    check.passed ? "text-emerald-600" : "text-muted-foreground"
                  )}
                >
                  <CheckCircle2
                    className={cn(
                      "h-3 w-3 shrink-0",
                      check.passed ? "opacity-100" : "opacity-30"
                    )}
                  />
                  {check.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Confirm password ── */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            disabled={isSubmitting}
            className={cn(
              "h-10 pr-10",
              errors.confirmPassword &&
                "border-red-400 focus-visible:ring-red-400"
            )}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            disabled={isSubmitting}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2",
              "text-muted-foreground hover:text-foreground transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            )}
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* ── Submit ── */}
      <Button
        type="submit"
        className="w-full h-10 font-medium"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>

      {/* ── Terms ── */}
      <p className="text-center text-xs text-muted-foreground leading-relaxed">
        By creating an account you agree to our{" "}
        <span className="underline underline-offset-4 cursor-pointer hover:text-foreground transition-colors">
          Terms of Service
        </span>{" "}
        and{" "}
        <span className="underline underline-offset-4 cursor-pointer hover:text-foreground transition-colors">
          Privacy Policy
        </span>
      </p>
    </form>
  );
}
