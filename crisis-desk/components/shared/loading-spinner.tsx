// ============================================================
// LoadingSpinner — components/shared/loading-spinner.tsx
//
// A simple, accessible loading indicator used throughout
// the app for loading states.
// ============================================================

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  /** Size of the spinner in Tailwind classes */
  size?: "sm" | "md" | "lg";
  /** Optional label for screen readers */
  label?: string;
  /** Optional extra classes */
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
};

export function LoadingSpinner({
  size = "md",
  label = "Loading...",
  className,
}: LoadingSpinnerProps) {
  return (
    <div role="status" className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          // Spinning circle with a transparent top border
          "animate-spin rounded-full border-muted-foreground/30 border-t-foreground",
          sizeClasses[size]
        )}
      />
      {/* Hidden text for screen readers */}
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Full-page loading state — used while routes are loading
export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading Crisis Desk...
        </p>
      </div>
    </div>
  );
}
