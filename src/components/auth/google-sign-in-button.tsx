"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore, type AuthUser } from "@/lib/auth-store";
import { useToast } from "@/components/ui/toast";

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";

/**
 * "Continue with Google". The button hands us a Google ID token; the API verifies it and
 * returns the same session as a normal login (access token in memory, refresh cookie).
 * Renders nothing when no client id is configured.
 */
export function GoogleSignInButton({ redirectTo = "/" }: { redirectTo?: string }) {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const { toast } = useToast();

  if (!GOOGLE_CLIENT_ID) return null;

  async function onCredential(credential?: string) {
    if (!credential) {
      toast("Google sign-in failed. Try again.", "error");
      return;
    }
    try {
      const data = await apiFetch<{ accessToken: string; user: AuthUser }>(
        "/auth/google",
        {
          method: "POST",
          skipAuth: true,
          body: JSON.stringify({ credential }),
        },
      );
      setSession({ accessToken: data.accessToken, user: data.user });
      try {
        const me = await apiFetch<AuthUser>("/users/me");
        setSession({
          accessToken: data.accessToken,
          user: { ...data.user, ...me },
        });
      } catch {
        /* role/avatar enrichment is optional */
      }
      toast("You're signed in", "success");
      router.replace(redirectTo);
    } catch (e) {
      toast("Google sign-in failed. Try again.", "error", e);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-card-border" />
        or
        <span className="h-px flex-1 bg-card-border" />
      </div>
      <GoogleLogin
        onSuccess={(r) => void onCredential(r.credential)}
        onError={() => toast("Google sign-in failed. Try again.", "error")}
        text="continue_with"
        shape="rectangular"
        width="320"
      />
    </div>
  );
}
