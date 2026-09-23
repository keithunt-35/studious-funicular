// ============================================================
// Root Layout — app/layout.tsx
//
// This is the outermost wrapper for the entire application.
// Every page in the app is rendered inside this layout.
//
// It sets up:
//   1. Google Fonts (Inter for body, Geist Mono for code)
//   2. HTML metadata (title, description, theme color)
//   3. TanStack Query provider (for data fetching)
//   4. Sonner toaster (for toast notifications)
// ============================================================

import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/providers";
import { Toaster } from "sonner";

// Inter is a clean, legible font — perfect for a professional
// command-center UI. It renders well at all sizes.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap", // Shows text immediately while font loads
});

// Geist Mono for any code/monospace elements
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// App-wide metadata — shown in browser tab and search results
export const metadata: Metadata = {
  title: {
    // %s is replaced by the page-specific title
    template: "%s | Crisis Desk",
    default: "Crisis Desk — Event Incident Command Center",
  },
  description:
    "Real-time incident management for live events. Log, track, assign, and resolve problems as they happen.",
  keywords: ["incident management", "event operations", "crisis management"],
};

// Tells the browser to use our brand color for the mobile
// address bar / tab strip
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    // suppressHydrationWarning prevents a React warning that
    // happens when next-themes modifies the <html> class on
    // the client side for dark/light mode.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        {/*
          Providers wraps the app with:
          - TanStack Query (data fetching & caching)
          Any future global providers go in there too.
        */}
        <Providers>
          {children}
        </Providers>

        {/*
          Sonner Toaster — renders toast notifications globally.
          Position: bottom-right is professional and non-intrusive.
          richColors: uses our severity color palette automatically.
        */}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
            },
          }}
        />
      </body>
    </html>
  );
}
