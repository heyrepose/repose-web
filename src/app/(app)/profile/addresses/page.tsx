"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Address {
  id: string;
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  emirate: string;
  phone?: string | null;
  isDefault: boolean;
}

type FormState = {
  label: string;
  line1: string;
  line2: string;
  city: string;
  emirate: string;
  phone: string;
  isDefault: boolean;
};

const emptyForm: FormState = {
  label: "Home",
  line1: "",
  line2: "",
  city: "Dubai",
  emirate: "Dubai",
  phone: "",
  isDefault: true,
};

export default function AddressesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => apiFetch<Address[]>("/addresses"),
  });

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      apiFetch<Address>("/addresses", {
        method: "POST",
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["addresses"] });
      setForm(emptyForm);
      toast("Address saved", "success");
    },
    onError: (e) =>
      toast("Could not save address", "error", e),
  });

  const update = useMutation({
    mutationFn: () =>
      apiFetch<Address>(`/addresses/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["addresses"] });
      setEditingId(null);
      setForm(emptyForm);
      toast("Address updated", "success");
    },
    onError: (e) =>
      toast("Could not update address", "error", e),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/addresses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["addresses"] });
      setRemoveId(null);
      toast("Address removed", "success");
    },
    onError: (e) =>
      toast("Could not remove address", "error", e),
  });

  const setDefault = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/addresses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDefault: true }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["addresses"] });
      toast("Default address updated", "success");
    },
    onError: (e) =>
      toast("Could not set default", "error", e),
  });

  function startEdit(a: Address) {
    setEditingId(a.id);
    setForm({
      label: a.label ?? "Home",
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      emirate: a.emirate,
      phone: a.phone ?? "",
      isDefault: a.isDefault,
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Addresses</h1>

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : addresses.length === 0 ? (
        <p className="text-sm text-muted">No addresses yet. Add one below.</p>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-3 rounded-card border border-card-border bg-surface p-4 shadow-card"
            >
              <div>
                <p className="font-medium">
                  {a.label || "Address"}
                  {a.isDefault ? (
                    <span className="ml-2 text-xs text-primary">Default</span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                  <br />
                  {a.city}, {a.emirate}
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="text-xs text-primary underline"
                    onClick={() => startEdit(a)}
                  >
                    Edit
                  </button>
                  {!a.isDefault ? (
                    <button
                      type="button"
                      className="text-xs text-primary underline"
                      onClick={() => setDefault.mutate(a.id)}
                    >
                      Set default
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="text-xs text-muted underline"
                    onClick={() => setRemoveId(a.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        className="space-y-3 rounded-card border border-card-border bg-surface p-4 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (editingId) update.mutate();
          else create.mutate();
        }}
      >
        <h2 className="font-medium text-primary">
          {editingId ? "Edit address" : "Add address"}
        </h2>
        <Input
          placeholder="Label"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        />
        <Input
          required
          placeholder="Line 1"
          value={form.line1}
          onChange={(e) => setForm({ ...form, line1: e.target.value })}
        />
        <Input
          placeholder="Line 2"
          value={form.line2}
          onChange={(e) => setForm({ ...form, line2: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            required
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <Input
            required
            placeholder="Emirate"
            value={form.emirate}
            onChange={(e) => setForm({ ...form, emirate: e.target.value })}
          />
        </div>
        <Input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          />
          Set as default
        </label>
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={create.isPending || update.isPending}
            className="flex-1"
          >
            {editingId
              ? update.isPending
                ? "Saving…"
                : "Update address"
              : create.isPending
                ? "Saving…"
                : "Save address"}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <ConfirmDialog
        open={Boolean(removeId)}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) remove.mutate(removeId);
        }}
        title="Remove address?"
        description="This delivery address will be deleted. Orders already placed keep their shipping snapshot."
        confirmLabel="Remove"
        destructive
        busy={remove.isPending}
      />
    </div>
  );
}
