"use client";

// ============================================================
// Providers — components/shared/providers.tsx
//
// Why a separate file?
// Next.js App Router uses React Server Components by default.
// The root layout.tsx is a Server Component, but TanStack Query
// requires a client-side context provider.
//
// Solution: extract all client providers into this file and
// mark it "use client". The layout stays a Server Component
// and simply renders <Providers> as a child.
// ============================================================

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

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
            // Don't retry failed requests by default in this app —
            // Firebase errors are usually auth/permission issues,
            // not transient network failures.
            retry: 1,
            // Keep data fresh for 60 seconds before refetching
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
