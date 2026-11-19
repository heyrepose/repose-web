"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronRight, Bell, Shield, User, Wallet } from "lucide-react";
import { apiFetch, signOut } from "@/lib/api-client";
import { useAuth } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Me = {
  id: string;
  fullName?: string;
  notifyOrderUpdates?: boolean;
  notifyMessages?: boolean;
  notifyMarketing?: boolean;
};

const items = [
  { href: "/profile/edit", label: "Edit profile", icon: User },
  { href: "/notifications", label: "Notifications inbox", icon: Bell },
  { href: "/profile/wallet", label: "Wallet & payouts", icon: Wallet },
  { href: "/settings/security", label: "Security & account", icon: Shield },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => apiFetch<Me>("/users/me"),
  });

  const [prefs, setPrefs] = useState({
    notifyOrderUpdates: true,
    notifyMessages: true,
    notifyMarketing: true,
  });

  useEffect(() => {
    if (!me) return;
    setPrefs({
      notifyOrderUpdates: me.notifyOrderUpdates ?? true,
      notifyMessages: me.notifyMessages ?? true,
      notifyMarketing: me.notifyMarketing ?? true,
    });
  }, [me]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify(prefs),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["users", "me"] });
      toast("Preferences saved", "success");
    },
    onError: (e) =>
      toast("Could not save", "error", e),
  });

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Signed in as {user?.fullName ?? user?.phone ?? user?.email ?? "you"}.
        </p>
      </header>

      <nav className="overflow-hidden rounded-card border border-card-border bg-surface shadow-card">
        {items.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              "flex min-h-[52px] items-center gap-3 px-4 text-sm font-medium " +
              (i < items.length - 1 ? "border-b border-card-border" : "")
            }
          >
            <item.icon className="h-5 w-5 text-primary" />
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        ))}
        {user?.role === "ADMIN" ? (
          <Link
            href="/admin"
            className="flex min-h-[52px] items-center gap-3 border-t border-card-border px-4 text-sm font-medium"
          >
            <Shield className="h-5 w-5 text-primary" />
            <span className="flex-1">Admin dashboard</span>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        ) : null}
      </nav>

      <section className="rounded-card border border-card-border bg-surface p-4 shadow-card">
        <h2 className="text-sm font-semibold">Notification preferences</h2>
        <p className="mt-1 text-xs text-muted">
          Choose what reaches your inbox.
        </p>
        <ul className="mt-4 space-y-3">
          {(
            [
              ["notifyOrderUpdates", "Order updates"],
              ["notifyMessages", "Messages"],
              ["notifyMarketing", "Tips & marketing"],
            ] as const
          ).map(([key, label]) => (
            <li key={key} className="flex items-center justify-between gap-3">
              <span className="text-sm">{label}</span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-[var(--color-primary,#264A2E)]"
                checked={prefs[key]}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, [key]: e.target.checked }))
                }
              />
            </li>
          ))}
        </ul>
        <Button
          className="mt-4 w-full"
          disabled={save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Saving…" : "Save preferences"}
        </Button>
      </section>

      <p className="text-center text-xs text-muted">
        Browse stays open without an account. Save, message, and checkout need
        sign-in.
      </p>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setLogoutOpen(true)}
      >
        Log out
      </Button>

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={async () => {
          await signOut();
          toast("Signed out", "default");
          window.location.href = "/";
        }}
        title="Log out?"
        description="You’ll need to sign in again to save items, message sellers, or checkout."
        confirmLabel="Log out"
        destructive
      />
    </div>
  );
}
