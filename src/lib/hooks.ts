"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { useAuthStore, type AuthUser } from "./auth-store";

export function useAuth(): {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  clearSession: () => void;
} {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const clearSession = useAuthStore((s) => s.clearSession);

  return {
    accessToken,
    user,
    isAuthenticated: Boolean(accessToken),
    hydrated,
    clearSession,
  };
}

/**
 * Call before gated actions (save, message, checkout).
 * Redirects to login with return path when unauthenticated.
 * Returns true if authenticated and action may proceed.
 */
export function useRequireAuth(redirectPath?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, hydrated } = useAuth();

  return useCallback(() => {
    if (!hydrated) return false;
    if (isAuthenticated) return true;

    const current = redirectPath ?? pathname;
    router.push(`/login?redirect=${encodeURIComponent(current)}`);
    return false;
  }, [hydrated, isAuthenticated, pathname, redirectPath, router]);
}
