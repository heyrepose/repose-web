"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Spinner } from "@/components/ui/spinner";

type State = "working" | "done" | "failed";

function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>(token ? "working" : "failed");
  const [email, setEmail] = useState<string | null>(null);
  // Tokens are single-use: guard against React strict-mode's double effect consuming it twice.
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    apiFetch<{ email: string }>("/auth/email/verify", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        setEmail(res.email);
        setState("done");
      })
      .catch(() => setState("failed"));
  }, [token]);

  return (
    <div className="mx-auto w-full max-w-md text-center">
      {state === "working" ? (
        <>
          <Spinner />
          <p className="mt-3 text-sm text-muted">Verifying your email…</p>
        </>
      ) : null}
      {state === "done" ? (
        <>
          <h1 className="text-2xl font-semibold">Email verified</h1>
          <p className="mt-2 text-sm text-muted">
            {email ? `${email} is now confirmed.` : "Your email is confirmed."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Continue to Repose
          </Link>
        </>
      ) : null}
      {state === "failed" ? (
        <>
          <h1 className="text-2xl font-semibold">Link expired</h1>
          <p className="mt-2 text-sm text-muted">
            This verification link is invalid or has already been used. You can
            request a new one from Settings → Security &amp; account.
          </p>
          <Link
            href="/settings/security"
            className="mt-6 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Go to settings
          </Link>
        </>
      ) : null}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <VerifyEmail />
    </Suspense>
  );
}
