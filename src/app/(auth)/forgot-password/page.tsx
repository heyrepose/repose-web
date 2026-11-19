"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

const schema = z.object({
  identifier: z.string().min(3, "Enter your phone or email"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [sentToEmail, setSentToEmail] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit({ identifier }: FormValues) {
    const value = identifier.trim();
    try {
      // The API answers identically whether or not the account exists.
      await apiFetch("/auth/password/forgot", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ identifier: value }),
      });
      if (value.includes("@")) {
        setSentToEmail(true);
      } else {
        router.push(`/reset-password?phone=${encodeURIComponent(value)}`);
      }
    } catch (e) {
      toast("Could not start the reset. Try again shortly.", "error", e);
    }
  }

  if (sentToEmail) {
    return (
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-muted">
          If an account with a verified email matches, we&apos;ve sent a link to
          reset your password. It expires in 30 minutes.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <p className="mt-1 text-sm text-muted">
        Enter your phone to get a code by SMS, or your email to get a reset
        link.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <Input
          label="Phone or email"
          autoComplete="username"
          error={errors.identifier?.message}
          {...register("identifier")}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
          Continue
        </Button>
        <Link
          href="/login"
          className="text-center text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Back to log in
        </Link>
      </form>
    </div>
  );
}
