"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

const schema = z.object({
  fullName: z.string().min(2).max(80),
  bio: z.string().max(500).optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

type Me = {
  fullName: string;
  bio?: string | null;
  avatarUrl?: string | null;
};

export default function EditProfilePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<Me>("/users/me"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data) {
      reset({
        fullName: data.fullName,
        bio: data.bio ?? "",
        avatarUrl: data.avatarUrl ?? "",
      });
    }
  }, [data, reset]);

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: values.fullName,
          bio: values.bio || undefined,
          avatarUrl: values.avatarUrl || undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast("Profile updated", "success");
    },
    onError: (e) =>
      toast("Could not save profile", "error", e),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl">Edit profile</h1>
      <form
        onSubmit={handleSubmit((v) => save.mutate(v))}
        className="mt-6 flex flex-col gap-4"
      >
        <Input
          label="Full name"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <Textarea
          label="Bio"
          error={errors.bio?.message}
          {...register("bio")}
        />
        <Input
          label="Avatar URL"
          error={errors.avatarUrl?.message}
          {...register("avatarUrl")}
        />
        <Button type="submit" disabled={isSubmitting || save.isPending}>
          Save
        </Button>
      </form>
    </div>
  );
}
