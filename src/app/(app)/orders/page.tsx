"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Package } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatAed, cn } from "@/lib/utils";
import { getChatSocket } from "@/lib/socket";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useQueryClient } from "@tanstack/react-query";

type OrderSummary = {
  id: string;
  status: string;
  totalAed: string;
  mainImageUrl?: string | null;
  title?: string;
  items?: Array<{
    listing: { title: string; mainImageUrl?: string | null };
  }>;
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "PAID_HELD", label: "To ship" },
  { value: "PENDING_PAYMENT", label: "Pending" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "RELEASED", label: "Complete" },
] as const;

function nextStep(status: string, role: "buyer" | "seller"): string {
  if (role === "buyer") {
    switch (status) {
      case "PENDING_PAYMENT":
        return "Complete payment";
      case "PAID_HELD":
        return "Waiting for seller to ship";
      case "SHIPPED":
        return "Confirm when it arrives";
      case "DELIVERED":
        return "Leave a review";
      case "RELEASED":
        return "Order complete";
      default:
        return status.replaceAll("_", " ");
    }
  }
  switch (status) {
    case "PAID_HELD":
      return "Ship this order";
    case "SHIPPED":
      return "Waiting for buyer confirmation";
    case "DELIVERED":
    case "RELEASED":
      return "Sale complete";
    default:
      return status.replaceAll("_", " ");
  }
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      }
    >
      <OrdersInner />
    </Suspense>
  );
}

function OrdersInner() {
  const searchParams = useSearchParams();
  const initialRole =
    searchParams.get("role") === "seller" ? "seller" : "buyer";
  const [role, setRole] = useState<"buyer" | "seller">(initialRole);
  const [status, setStatus] = useState(
    searchParams.get("status") ??
      (initialRole === "seller" ? "PAID_HELD" : ""),
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    if (searchParams.get("role") === "seller") setRole("seller");
  }, [searchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", role, status],
    queryFn: () =>
      apiFetch<OrderSummary[]>(
        `/orders?role=${role}&limit=40${status ? `&status=${status}` : ""}`,
      ),
  });

  useEffect(() => {
    const socket = getChatSocket();
    if (!socket) return;
    const handler = () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    };
    socket.on("order:status_changed", handler);
    return () => {
      socket.off("order:status_changed", handler);
    };
  }, [queryClient]);

  function switchRole(next: "buyer" | "seller") {
    setRole(next);
    setStatus(next === "seller" ? "PAID_HELD" : "");
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">Orders</h1>

      <div className="mt-4 flex gap-2">
        {(["buyer", "seller"] as const).map((r) => (
          <Button
            key={r}
            size="sm"
            variant={role === r ? "primary" : "outline"}
            onClick={() => switchRole(r)}
          >
            {r === "buyer" ? "Buying" : "Selling"}
          </Button>
        ))}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            type="button"
            onClick={() => setStatus(f.value)}
            className={cn(
              "shrink-0 rounded-pill border px-3 py-1.5 text-xs font-medium",
              status === f.value
                ? "border-primary bg-primary text-surface"
                : "border-card-border bg-surface text-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-muted">Could not load orders.</p>
      ) : !data?.length ? (
        <EmptyState
          title="No orders yet"
          description={
            role === "buyer"
              ? "When you buy something, it will show up here."
              : "Sales will appear here once buyers check out."
          }
          icon={<Package className="h-6 w-6" />}
          action={
            role === "buyer" ? (
              <Link href="/search">
                <Button>Browse</Button>
              </Link>
            ) : (
              <Link href="/sell">
                <Button>Sell an item</Button>
              </Link>
            )
          }
        />
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {data.map((o) => {
            const thumb =
              o.mainImageUrl ?? o.items?.[0]?.listing.mainImageUrl ?? null;
            const title =
              o.title ??
              o.items?.[0]?.listing.title ??
              `Order ${o.id.slice(0, 8)}`;
            return (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="flex gap-3 rounded-card border border-card-border bg-surface p-3 shadow-card"
                >
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-card bg-accent-soft">
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">
                      {o.status.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs text-primary">
                      {nextStep(o.status, role)}
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {formatAed(o.totalAed)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
