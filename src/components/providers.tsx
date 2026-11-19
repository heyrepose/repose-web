"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { refreshSession } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { ToastProvider } from "@/components/ui/toast";

/**
 * The access token lives in memory only, so on every page load a returning user (one with a
 * persisted profile) gets a fresh one from the httpOnly refresh cookie. `hydrated` flips to
 * true only after that attempt, so gated pages show "Checking session…" instead of flashing
 * a login redirect.
 */
function AuthHydration({ children }: { children: ReactNode }) {
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await Promise.resolve(useAuthStore.persist.rehydrate());
        if (useAuthStore.getState().user) await refreshSession();
      } catch {
        /* fall through: treat as signed out */
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
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

  const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const app = (
    <QueryClientProvider client={client}>
      <AuthHydration>
        <ToastProvider>{children}</ToastProvider>
      </AuthHydration>
    </QueryClientProvider>
  );

  // The Google script is only loaded when sign-in is actually configured.
  return googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
  ) : (
    app
  );
}
