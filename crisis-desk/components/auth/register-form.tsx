"use client";

// ============================================================
// RegisterForm — components/auth/register-form.tsx
//
// Skeleton registration form. Step 2 will replace the
// placeholder handler with real Firebase auth logic.
// ============================================================

import { useState } from "react";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Placeholder — Step 2 will implement real Firebase auth
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setError("Registration will be wired up in Step 2.");
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Full name */}
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-sm font-medium">
          Full name
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Jane Smith"
          autoComplete="name"
          autoFocus
          disabled={isLoading}
          className="h-10"
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isLoading}
          className="h-10"
        />
      </div>

      {/* Password */}
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
            disabled={isLoading}
            className="h-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
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
        <p className="text-xs text-muted-foreground">
          Must be at least 8 characters long
        </p>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-10 font-medium"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>

      {/* Terms note */}
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
