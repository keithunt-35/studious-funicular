// ============================================================
// Auth Layout — app/(auth)/layout.tsx
//
// Wraps all auth pages (login, register) in a consistent
// two-column layout:
//   Left:  Branding panel with app name, tagline, features
//   Right: The actual form (login / register)
//
// The (auth) folder name uses Next.js "Route Groups" —
// the parentheses mean this folder doesn't affect the URL.
// So /app/(auth)/login/page.tsx → URL is just /login
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/*
        ── LEFT PANEL ──────────────────────────────────────────
        Branding side — hidden on mobile, shown on lg+ screens.
        Dark background for strong visual contrast with the
        white form panel on the right.
      */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between bg-zinc-950 p-12 relative overflow-hidden">

        {/* Subtle background pattern for depth */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* Top: Logo + App name */}
        <div className="relative z-10 flex items-center gap-3">
          {/* App logo mark — a simple shield icon made with CSS */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 shadow-lg">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-white"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Crisis Desk
          </span>
        </div>

        {/* Middle: Hero content */}
        <div className="relative z-10 space-y-8">
          {/* Main headline */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Event Command Center
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
              Stay calm.
              <br />
              <span className="text-zinc-400">Stay in control.</span>
            </h1>
            <p className="text-base text-zinc-400 leading-relaxed max-w-md">
              When things go wrong at your event, Crisis Desk keeps your team
              coordinated, informed, and moving fast.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {[
              "Real-time incident tracking across departments",
              "Instant assignment and escalation tools",
              "Full activity timeline for every incident",
              "Built for events of any size",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3 text-emerald-400"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: Severity legend */}
        <div className="relative z-10">
          <p className="mb-3 text-xs text-zinc-500 uppercase tracking-wider">
            Severity Levels
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Critical", color: "bg-red-600" },
              { label: "High", color: "bg-orange-500" },
              { label: "Medium", color: "bg-amber-500" },
              { label: "Low", color: "bg-blue-500" },
              { label: "Resolved", color: "bg-emerald-500" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${color}`} />
                <span className="text-xs text-zinc-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/*
        ── RIGHT PANEL ─────────────────────────────────────────
        Form side — full width on mobile, half width on desktop.
        Clean white background with the actual page content.
      */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-6 sm:p-12">
        {/* Mobile-only logo (shown when left panel is hidden) */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-white"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">Crisis Desk</span>
        </div>

        {/* Page content (login or register form) renders here */}
        <div className="w-full max-w-sm">{children}</div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Crisis Desk. Built for event teams.
        </p>
      </div>
    </div>
  );
}
