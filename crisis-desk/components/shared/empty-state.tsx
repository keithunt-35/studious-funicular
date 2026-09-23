// ============================================================
// EmptyState — components/shared/empty-state.tsx
//
// Displayed when a list has no items to show.
// A good empty state tells users why there's nothing here
// and what they can do about it.
// ============================================================

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Main heading */
  title: string;
  /** Supporting description */
  description?: string;
  /** Optional call-to-action button */
  action?: React.ReactNode;
  /** Optional extra classes */
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      {/* Icon in a soft rounded container */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Icon aria-hidden="true" className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>

      {/* Description */}
      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}

      {/* Optional action button */}
      {action && <div>{action}</div>}
    </div>
  );
}
