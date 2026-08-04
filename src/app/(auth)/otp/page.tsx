"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
  code: z.string().length(6, "Enter the 6-digit code"),
});

type FormValues = z.infer<typeof schema>;

function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const purpose = searchParams.get("purpose") ?? "SIGNUP";
  const setSession = useAuthStore((s) => s.setSession);
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const data = await apiFetch<{
        accessToken: string;
        user: AuthUser;
      }>("/auth/otp/verify", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({
          phone,
          code: values.code,
          purpose,
        }),
      });
      setSession({ accessToken: data.accessToken, user: data.user });
      try {
        const me = await apiFetch<AuthUser & { role?: string }>("/users/me");
        setSession({
          accessToken: data.accessToken,
          user: { ...data.user, ...me },
        });
      } catch {
        /* optional */
      }
      toast("You're signed in", "success");
      router.replace("/");
    } catch (e) {
      const message = getErrorToastMessage(e, "Invalid code. Try again.");
      setFormError(message);
      toast("Invalid code. Try again.", "error", e);
    }
  }

  if (!phone) {
    return (
      <p className="text-sm text-muted">
        Missing phone. Start from{" "}
        <a href="/signup" className="text-primary">
          signup
        </a>
        .
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="font-display text-2xl">Verify phone</h1>
      <p className="mt-1 text-sm text-muted">
        Enter the code sent to {phone}. In local MVP, read it from the API
        server logs.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <Input
          label="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          error={errors.code?.message}
          {...register("code")}
        />
        {formError ? <p className="text-sm text-muted">{formError}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
          Verify
        </Button>
      </form>
    </div>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <OtpForm />
    </Suspense>
  );
}
