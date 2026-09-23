// ============================================================
// cn() — Class Name Utility
//
// This is the standard shadcn/ui utility function.
// It combines two libraries:
//   - clsx: handles conditional class names
//   - tailwind-merge: resolves conflicting Tailwind classes
//
// Example:
//   cn("px-4 py-2", isActive && "bg-blue-500", "px-6")
//   → "py-2 bg-blue-500 px-6"  (px-6 wins over px-4)
// ============================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
