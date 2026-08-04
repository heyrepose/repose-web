"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type Category = {
  id: string;
  name: string;
  slug: string;
  isActive?: boolean;
  sortOrder?: number;
};

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pending, setPending] = useState<{
    id: string;
    isActive: boolean;
    name: string;
  } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["categories-admin"],
    queryFn: () => apiFetch<Category[]>("/categories", { skipAuth: true }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiFetch(`/admin/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
      setPending(null);
      toast(
        vars.isActive ? "Category activated" : "Category deactivated",
        "success",
      );
    },
    onError: (e) =>
      toast("Could not update category", "error", e),
  });

  return (
    <div>
      <h1 className="font-display text-2xl">Categories</h1>
      <p className="mt-1 text-sm text-muted">
        Public list shows active only. Toggle via admin API.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-muted">Could not load categories.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {(data ?? []).map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-card border border-card-border bg-surface p-3 shadow-card"
            >
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted">{c.slug}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={toggle.isPending}
                onClick={() => {
                  const nextActive = c.isActive === false;
                  if (!nextActive) {
                    setPending({
                      id: c.id,
                      isActive: false,
                      name: c.name,
                    });
                    return;
                  }
                  toggle.mutate({ id: c.id, isActive: true });
                }}
              >
                {c.isActive === false ? "Activate" : "Deactivate"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending) toggle.mutate(pending);
        }}
        title="Deactivate category?"
        description={`${pending?.name ?? "This category"} will be hidden from public navigation until reactivated.`}
        confirmLabel="Deactivate"
        destructive
        busy={toggle.isPending}
      />
    </div>
  );
}
