"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch, getErrorToastMessage } from "@/lib/api-client";
import { useAuthStore, type AuthUser } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

const schema = z.object({
  identifier: z.string().min(3, "Enter phone or email"),
  password: z.string().min(8, "Password required"),
});

type FormValues = z.infer<typeof schema>;

/** Seeded buyer from prisma/seed.ts — only used when NODE_ENV=development. */
const DEV_LOGIN_DEFAULTS: FormValues = {
  identifier: "khalid@repose.ae",
  password: "password123",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const isDev = process.env.NODE_ENV === "development";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: isDev ? DEV_LOGIN_DEFAULTS : undefined,
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const data = await apiFetch<{
        accessToken: string;
        user: AuthUser;
      }>("/auth/login", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify(values),
      });
      setSession({ accessToken: data.accessToken, user: data.user });
      try {
        const me = await apiFetch<AuthUser & { role?: string }>("/users/me");
        setSession({
          accessToken: data.accessToken,
          user: { ...data.user, ...me },
        });
      } catch {
        /* role enrichment optional */
      }
      const redirect = searchParams.get("redirect") || "/";
      toast("Welcome back", "success");
      router.replace(redirect);
    } catch (e) {
      const message = getErrorToastMessage(e, "Login failed. Try again.");
      setFormError(message);
      toast("Login failed. Try again.", "error", e);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <p className="font-brand text-4xl text-primary">Repose</p>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
          Pose it. Post it. Sell it.
        </p>
      </div>
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-1 text-sm text-muted">
        New here?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Create an account
        </Link>
      </p>

      {isDev ? (
        <p className="mt-3 rounded-card border border-card-border bg-accent-soft/40 px-3 py-2 text-xs text-muted">
          Dev preset: <span className="font-medium text-text">khalid@repose.ae</span>{" "}
          / password123 (seeded buyer)
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-4"
      >
        <Input
          label="Phone or email"
          autoComplete="username"
          error={errors.identifier?.message}
          {...register("identifier")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        {formError ? <p className="text-sm text-muted">{formError}</p> : null}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
          Continue
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LoginForm />
    </Suspense>
  );
}
