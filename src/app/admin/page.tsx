"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { formatAed } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

type Dashboard = {
  gmvAed: string;
  userCount: number;
  activeListings: number;
  ordersToday: number;
  ordersThisWeek: number;
  pendingModerationCount: number;
};

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => apiFetch<Dashboard>("/admin/dashboard"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-muted">
        Could not load dashboard. Confirm ADMIN role and API availability.
      </p>
    );
  }

  const cards = [
    { label: "GMV", value: formatAed(data.gmvAed) },
    { label: "Users", value: String(data.userCount) },
    { label: "Active listings", value: String(data.activeListings) },
    { label: "Orders today", value: String(data.ordersToday) },
    { label: "Orders this week", value: String(data.ordersThisWeek) },
    {
      label: "Pending moderation",
      value: String(data.pendingModerationCount),
      href: "/admin/reports",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-1 text-sm text-muted">Platform overview</p>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map((c) => {
          const inner = (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {c.label}
              </p>
              <p className="mt-2 text-xl font-bold text-primary">{c.value}</p>
            </>
          );
          return c.href ? (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-card border border-card-border bg-surface p-4 shadow-card transition-colors hover:bg-accent-soft/30"
            >
              {inner}
            </Link>
          ) : (
            <div
              key={c.label}
              className="rounded-card border border-card-border bg-surface p-4 shadow-card"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
