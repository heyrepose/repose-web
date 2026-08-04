"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch, getErrorToastMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

const schema = z
  .object({
    fullName: z.string().min(2).max(80),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    password: z.string().min(8).max(72).optional().or(z.literal("")),
  })
  .refine((v) => Boolean(v.phone?.trim() || v.email?.trim()), {
    message: "Phone or email is required",
    path: ["phone"],
  });

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
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
      const body: Record<string, string> = {
        fullName: values.fullName,
      };
      if (values.phone?.trim()) body.phone = values.phone.trim();
      if (values.email?.trim()) body.email = values.email.trim();
      if (values.password?.trim()) body.password = values.password.trim();

      await apiFetch<{ userId: string; phoneVerificationRequired?: boolean }>(
        "/auth/signup",
        {
          method: "POST",
          skipAuth: true,
          body: JSON.stringify(body),
        },
      );

      const phone = values.phone?.trim();
      if (phone) {
        await apiFetch("/auth/otp/request", {
          method: "POST",
          skipAuth: true,
          body: JSON.stringify({ phone, purpose: "SIGNUP" }),
        });
        toast("Check your phone for a code", "success");
        router.push(`/otp?phone=${encodeURIComponent(phone)}&purpose=SIGNUP`);
      } else {
        toast("Account created — log in to continue", "success");
        router.push("/login");
      }
    } catch (e) {
      const message = getErrorToastMessage(e, "Signup failed. Try again.");
      setFormError(message);
      toast("Signup failed. Try again.", "error", e);
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
      <h1 className="text-2xl font-semibold">Create account</h1>
      <p className="mt-1 text-sm text-muted">
        Already have one?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Log in
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <Input
          label="Full name"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <Input
          label="Phone"
          placeholder="+971…"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input
          label="Email (optional)"
          type="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password (optional)"
          type="password"
          error={errors.password?.message}
          {...register("password")}
        />
        {formError ? <p className="text-sm text-muted">{formError}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="h-4 w-4" /> : null}
          Continue
        </Button>
      </form>
    </div>
  );
}
