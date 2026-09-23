"use client";

// ============================================================
// Providers — components/shared/providers.tsx
//
// All client-side context providers, in order:
//   1. ThemeProvider  — dark/light mode (next-themes)
//   2. QueryClientProvider — TanStack Query data fetching
//   3. AuthProvider   — Firebase auth state
// ============================================================

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { AuthProvider } from "@/lib/firebase/auth-context";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    // ThemeProvider must be outermost so all children can read the theme.
    // attribute="class" → adds "dark" class to <html> for Tailwind dark mode.
    // defaultTheme="system" → respects the user's OS preference on first visit.
    // enableSystem → automatically follows OS dark/light preference.
    // disableTransitionOnChange → prevents a flash when switching themes.
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
