"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch, getErrorToastMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

const passwordRule = z
  .string()
  .max(72)
  .regex(
    /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
    "At least 8 characters with a letter and a number",
  );

const schema = z
  .object({
    code: z.string().optional(),
    newPassword: passwordRule,
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const token = params.get("token");
  const phone = params.get("phone");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!token && !phone) {
    return (
      <p className="text-sm text-muted">
        This reset link is incomplete.{" "}
        <Link href="/forgot-password" className="text-primary">
          Start again
        </Link>
        .
      </p>
    );
  }

  async function onSubmit(values: FormValues) {
    setFormError(null);
    if (!token && !/^\d{6}$/.test(values.code ?? "")) {
      setError("code", { message: "Enter the 6-digit code" });
      return;
    }
    try {
      await apiFetch("/auth/password/reset", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify(
          token
            ? { token, newPassword: values.newPassword }
            : { phone, code: values.code, newPassword: values.newPassword },
        ),
      });
      toast("Password updated — log in with your new password", "success");
      router.replace("/login");
    } catch (e) {
      setFormError(getErrorToastMessage(e, "Could not reset your password."));
      toast("Could not reset your password.", "error", e);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      {phone ? (
        <p className="mt-1 text-sm text-muted">
          Enter the code sent to {phone}. In local MVP, read it from the API
          server logs.
        </p>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        {!token ? (
          <Input
            label="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            error={errors.code?.message}
            {...register("code")}
          />
        ) : null}
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="8+ characters, a letter and a number"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register("confirm")}
        />
        {formError ? <p className="text-sm text-muted">{formError}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
          Update password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ResetForm />
    </Suspense>
  );
}
