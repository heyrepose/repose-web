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
  accessToken: string | null;
  user: AuthUser | null;
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
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
