"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { ToastProvider } from "@/components/ui/toast";

function AuthHydration({ children }: { children: ReactNode }) {
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    void Promise.resolve(useAuthStore.persist.rehydrate()).then(
      () => setHydrated(true),
      () => setHydrated(true),
    );
  }, [setHydrated]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <AuthHydration>
        <ToastProvider>{children}</ToastProvider>
      </AuthHydration>
    </QueryClientProvider>
  );
}
