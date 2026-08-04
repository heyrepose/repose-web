"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Package,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatAed, cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

type Dashboard = {
  overview: {
    activeCount: number;
    draftCount: number;
    soldCount: number;
    totalViews: number;
    balanceAed: string;
    pendingAed: string;
    salesAedThisMonth: string;
    onboardingComplete: boolean;
  };
  salesOverTime: Array<{ date: string; amountAed: string; orderCount: number }>;
  topListings: Array<{
    id: string;
    title: string | null;
    mainImageUrl: string | null;
    viewCount: number;
    status: string;
    priceAed: string | null;
  }>;
  recentSales: Array<{
    orderId: string;
    listingTitle: string | null;
    amountAed: string;
    status: string;
    createdAt: string;
  }>;
};

export default function SellerDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["seller", "dashboard"],
    queryFn: () => apiFetch<Dashboard>("/seller/dashboard"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-muted">Could not load seller dashboard.</p>;
  }

  const { overview, salesOverTime, topListings, recentSales } = data;
  const maxSale = Math.max(
    1,
    ...salesOverTime.map((d) => Number(d.amountAed) || 0),
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Seller dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Listings, sales, and wallet at a glance.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active", value: String(overview.activeCount) },
          { label: "Drafts", value: String(overview.draftCount) },
          { label: "Sold", value: String(overview.soldCount) },
          { label: "Views", value: String(overview.totalViews) },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-card border border-card-border bg-surface p-4 shadow-card"
          >
            <p className="text-xs text-muted">{card.label}</p>
            <p className="mt-1 text-xl font-bold text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-card bg-primary px-5 py-5 text-surface shadow-card">
          <p className="text-xs text-accent-soft">Available</p>
          <p className="mt-1 text-2xl font-bold">
            {formatAed(overview.balanceAed)}
          </p>
          <p className="mt-2 text-xs text-accent-soft">
            Pending · {formatAed(overview.pendingAed)}
          </p>
        </div>
        <div className="rounded-card border border-card-border bg-surface px-5 py-5 shadow-card">
          <p className="text-xs text-muted">Sales this month (net)</p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {formatAed(overview.salesAedThisMonth)}
          </p>
          {!overview.onboardingComplete ? (
            <Link
              href="/profile/wallet"
              className="mt-3 inline-block text-xs font-medium text-primary underline"
            >
              Complete payout setup
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/profile/listings">
          <Button size="sm" variant="outline">
            <Package className="h-4 w-4" />
            My listings
          </Button>
        </Link>
        <Link href="/orders?role=seller">
          <Button size="sm" variant="outline">
            <ShoppingBag className="h-4 w-4" />
            Sales
          </Button>
        </Link>
        <Link href="/profile/wallet">
          <Button size="sm" variant="outline">
            <Wallet className="h-4 w-4" />
            Wallet
          </Button>
        </Link>
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Sales · last 30 days</h2>
        </div>
        <div className="flex h-36 items-end gap-0.5 rounded-card border border-card-border bg-surface p-3 shadow-card">
          {salesOverTime.map((d) => {
            const h = (Number(d.amountAed) / maxSale) * 100;
            return (
              <div
                key={d.date}
                title={`${d.date}: ${formatAed(d.amountAed)}`}
                className={cn(
                  "min-w-0 flex-1 rounded-t-sm bg-primary/80",
                  h < 2 && Number(d.amountAed) === 0 && "bg-accent-soft",
                )}
                style={{ height: `${Math.max(h, Number(d.amountAed) > 0 ? 4 : 2)}%` }}
              />
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Top listings</h2>
        {topListings.length === 0 ? (
          <p className="text-sm text-muted">No listings yet.</p>
        ) : (
          <ul className="space-y-2">
            {topListings.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/listing/${l.id}`}
                  className="flex gap-3 rounded-card border border-card-border bg-surface p-3 shadow-card"
                >
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-card bg-accent-soft">
                    {l.mainImageUrl ? (
                      <Image
                        src={l.mainImageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">
                      {l.title || "Untitled"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {l.viewCount} views · {l.status.replaceAll("_", " ")}
                    </p>
                  </div>
                  {l.priceAed ? (
                    <span className="text-sm font-semibold">
                      {formatAed(l.priceAed)}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Recent sales</h2>
        {recentSales.length === 0 ? (
          <p className="text-sm text-muted">No sales yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentSales.map((s) => (
              <li key={`${s.orderId}-${s.createdAt}`}>
                <Link
                  href={`/orders/${s.orderId}`}
                  className="flex items-center justify-between rounded-card border border-card-border bg-surface px-4 py-3 text-sm shadow-card"
                >
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-medium">
                      {s.listingTitle || "Sale"}
                    </p>
                    <p className="text-xs text-muted">
                      {s.status.replaceAll("_", " ")} ·{" "}
                      {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-semibold">{formatAed(s.amountAed)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
