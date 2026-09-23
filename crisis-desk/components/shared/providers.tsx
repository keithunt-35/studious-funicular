"use client";

// ============================================================
// Providers — components/shared/providers.tsx
//
// All client-side context providers live here.
// The root layout (a Server Component) renders this once,
// wrapping the entire app.
//
// Provider order matters — outer providers are available to
// inner ones. AuthProvider is inside QueryClientProvider so
// auth queries can use the same QueryClient if needed.
// ============================================================

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/lib/firebase/auth-context";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // useState ensures each browser session gets its own QueryClient.
  // If we created it outside the component, it would be shared
  // across all server renders (bad for data isolation in SSR).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Firebase errors are usually auth/permission issues,
            // not transient failures — limit retries.
            retry: 1,
            // Data is considered fresh for 60 seconds
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/*
        AuthProvider listens to Firebase onAuthStateChanged and
        makes the current user available to all child components
        via useAuth() / useCurrentUser().
      */}
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
