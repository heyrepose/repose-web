"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  fullName?: string;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  avatarUrl?: string | null;
};

type AuthState = {
  /** In memory only. Restored on page load via the httpOnly refresh cookie (see providers.tsx). */
  accessToken: string | null;
  user: AuthUser | null;
  /** True once the persisted user has been loaded AND the session restore attempt finished. */
  hydrated: boolean;
  setSession: (session: { accessToken: string; user?: AuthUser | null }) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hydrated: false,
      setSession: ({ accessToken, user }) =>
        set((state) => ({
          accessToken,
          user: user === undefined ? state.user : user,
        })),
      clearSession: () => set({ accessToken: null, user: null }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "repose-auth",
      // v1 also persisted the access token in localStorage, where any XSS could read it.
      // v2 persists only the (non-secret) profile; migrate drops tokens left by v1.
      version: 2,
      migrate: (persisted) =>
        ({ user: (persisted as { user?: AuthUser | null } | undefined)?.user ?? null }) as never,
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
