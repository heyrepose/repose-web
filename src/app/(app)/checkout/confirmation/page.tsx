"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Check } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatAed } from "@/lib/utils";
import { getChatSocket } from "@/lib/socket";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

type OrderDetail = {
  id: string;
  status: string;
  totalAed: string;
  items?: Array<{
    listing: { title: string };
    priceAed: string;
  }>;
};

function ConfirmationInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const queryClient = useQueryClient();

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["order", orderId],
    enabled: Boolean(orderId),
    queryFn: () => apiFetch<OrderDetail>(`/orders/${orderId}`),
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING_PAYMENT" ? 2000 : false,
  });

  useEffect(() => {
    sessionStorage.removeItem("repose_checkout");
    sessionStorage.removeItem("repose_checkout_listing");
  }, []);

  useEffect(() => {
    if (!orderId) return;
    const socket = getChatSocket();
    if (!socket) return;
    const handler = (payload: { orderId?: string }) => {
      if (payload.orderId === orderId) {
        void queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      }
    };
    socket.on("order:status_changed", handler);
    return () => {
      socket.off("order:status_changed", handler);
    };
  }, [orderId, queryClient]);

  if (!orderId) {
    return <p className="text-sm text-muted">Missing order id.</p>;
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <Spinner />
        <p className="text-sm text-muted">Confirming payment…</p>
      </div>
    );
  }

  const pending = data.status === "PENDING_PAYMENT";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-primary">
        {pending ? (
          <Spinner />
        ) : (
          <Check className="h-8 w-8" strokeWidth={2.5} />
        )}
      </div>
      <div>
        <h1 className="text-2xl font-semibold">
          {pending ? "Processing payment…" : "Order confirmed"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Order {data.id.slice(0, 8)} · {formatAed(data.totalAed)}
        </p>
        {!pending ? (
          <p className="mt-1 text-xs uppercase tracking-wide text-primary">
            {data.status.replaceAll("_", " ")}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            If payment was declined, go back and try another card.
          </p>
        )}
      </div>

      {data.items?.length ? (
        <ul className="w-full rounded-card border border-card-border bg-surface p-4 text-left text-sm shadow-card">
          {data.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-2 py-1">
              <span className="line-clamp-1">{item.listing.title}</span>
              <span>{formatAed(item.priceAed)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {pending ? (
        <div className="flex w-full flex-col gap-2">
          <button
            type="button"
            className="text-sm text-primary underline"
            onClick={() => refetch()}
          >
            Refresh status
          </button>
          <Link href="/checkout" className="w-full">
            <Button variant="outline" className="w-full">
              Retry payment
            </Button>
          </Link>
        </div>
      ) : null}

      <Link href={`/orders/${data.id}`} className="w-full">
        <Button className="w-full">Track order</Button>
      </Link>
      <Link href="/" className="text-sm text-muted">
        Continue shopping
      </Link>
    </div>
  );
}

export default function CheckoutConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      }
    >
      <ConfirmationInner />
    </Suspense>
  );
}
