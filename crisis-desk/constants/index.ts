// ============================================================
// Crisis Desk — App-wide Constants
// Severity colors, status labels, categories, etc.
// ============================================================

// Severity levels and their Tailwind color classes
export const SEVERITY_CONFIG = {
  critical: {
    label: "Critical",
    color: "#B91C1C",
    bgClass: "bg-red-700",
    textClass: "text-red-700",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
  },
  high: {
    label: "High",
    color: "#EA580C",
    bgClass: "bg-orange-600",
    textClass: "text-orange-600",
    badgeClass: "bg-orange-100 text-orange-600 border-orange-200",
  },
  medium: {
    label: "Medium",
    color: "#D97706",
    bgClass: "bg-amber-600",
    textClass: "text-amber-600",
    badgeClass: "bg-amber-100 text-amber-600 border-amber-200",
  },
  low: {
    label: "Low",
    color: "#2563EB",
    bgClass: "bg-blue-600",
    textClass: "text-blue-600",
    badgeClass: "bg-blue-100 text-blue-600 border-blue-200",
  },
} as const;

// Incident status options
export const STATUS_CONFIG = {
  open: {
    label: "Open",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  },
  resolved: {
    label: "Resolved",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  closed: {
    label: "Closed",
    badgeClass: "bg-gray-100 text-gray-500 border-gray-200",
  },
} as const;

// Default incident categories
export const INCIDENT_CATEGORIES = [
  "AV / Technical",
  "Catering / Food",
  "Speaker / Presenter",
  "VIP / Guest",
  "Security",
  "Venue / Facilities",
  "Medical",
  "Logistics",
  "Staff",
  "Other",
] as const;

// User roles
export const USER_ROLES = {
  event_lead: "Event Lead",
  dept_lead: "Department Lead",
  staff: "Staff",
} as const;
