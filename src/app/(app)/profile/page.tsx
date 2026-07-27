"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ChevronRight,
  Heart,
  Package,
  Settings,
  ShoppingBag,
  Wallet,
  MapPin,
  Pencil,
  MessageCircle,
  Shield,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/hooks";
import { formatAed } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";

type Me = {
  id: string;
  fullName: string;
  username?: string | null;
  avatarUrl?: string | null;
  ratingAvg?: number | string;
  ratingCount?: number;
  itemsSoldCount?: number;
  itemsBoughtCount?: number;
  role?: string;
};

type WalletSummary = { balanceAed: string };

const LINKS = [
  { href: "/profile/listings", label: "My listings", icon: Package },
  { href: "/saved", label: "Saved", icon: Heart },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/profile/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile/addresses", label: "Addresses", icon: MapPin },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile/edit", label: "Edit profile", icon: Pencil },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function ProfilePage() {
  const { clearSession, user } = useAuth();
  const { toast } = useToast();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<Me>("/users/me"),
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => apiFetch<WalletSummary>("/wallet"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const name = me?.fullName ?? user?.fullName ?? "Profile";
  const ratingAvg =
    me?.ratingAvg != null && me.ratingAvg !== ""
      ? Number(me.ratingAvg)
      : null;
  const links =
    me?.role === "ADMIN" || user?.role === "ADMIN"
      ? [
          ...LINKS,
          { href: "/admin", label: "Admin", icon: Shield },
        ]
      : LINKS;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <header className="flex flex-col items-center gap-4 text-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-accent-soft">
          {me?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={me.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-primary">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{name}</h1>
          {me?.username ? (
            <p className="text-sm text-muted">@{me.username}</p>
          ) : null}
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-lg font-bold text-primary">
              {me?.itemsSoldCount ?? 0}
            </p>
            <p className="text-muted">Sold</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">
              {me?.itemsBoughtCount ?? 0}
            </p>
            <p className="text-muted">Bought</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">
              {ratingAvg != null && !Number.isNaN(ratingAvg)
                ? ratingAvg.toFixed(1)
                : "—"}
            </p>
            <p className="text-muted">Rating</p>
          </div>
        </div>
      </header>

      {wallet ? (
        <Link
          href="/profile/wallet"
          className="flex items-center justify-between rounded-card bg-primary px-5 py-4 text-surface shadow-card"
        >
          <div>
            <p className="text-xs text-accent-soft">Wallet balance</p>
            <p className="mt-1 text-xl font-bold">
              {formatAed(wallet.balanceAed)}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-accent-soft" />
        </Link>
      ) : null}

      <nav className="overflow-hidden rounded-card border border-card-border bg-surface shadow-card">
        {links.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              "flex min-h-[52px] items-center gap-3 px-4 text-sm font-medium " +
              (i < links.length - 1 ? "border-b border-card-border" : "")
            }
          >
            <item.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        ))}
      </nav>

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
        onConfirm={() => {
          clearSession();
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
