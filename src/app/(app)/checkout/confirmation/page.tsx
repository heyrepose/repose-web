"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
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
  const { toast } = useToast();
  const [retrying, setRetrying] = useState(false);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["order", orderId],
    enabled: Boolean(orderId),
    queryFn: () => apiFetch<OrderDetail>(`/orders/${orderId}`),
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING_PAYMENT" ? 2000 : false,
  });

  const pendingNow = data?.status === "PENDING_PAYMENT";

  // Stripe's webhook is the primary signal, but it can lag (or not be forwarded yet in local
  // dev). While the order is still pending, ask the API to check with Stripe directly —
  // server-to-server, so it never trusts anything in this browser.
  useEffect(() => {
    if (!orderId || !pendingNow) return;
    let cancelled = false;
    const sync = async () => {
      try {
        const res = await apiFetch<{ status: string }>(
          `/payments/orders/${orderId}/sync`,
          { method: "POST" },
        );
        if (!cancelled && res.status !== "PENDING_PAYMENT") {
          await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        }
      } catch {
        /* keep polling the order; the webhook may still arrive */
      }
    };
    void sync();
    const id = window.setInterval(sync, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [orderId, pendingNow, queryClient]);

  async function retryPayment() {
    if (!orderId) return;
    setRetrying(true);
    try {
      const res = await apiFetch<{ url: string }>("/payments/checkout", {
        method: "POST",
        body: JSON.stringify({ orderId }),
      });
      window.location.assign(res.url);
    } catch (e) {
      setRetrying(false);
      if (e instanceof ApiError && e.errorCode === "PAYMENT_ORDER_NOT_PENDING") {
        // Expired/cancelled (or already paid) — the order can't be paid again.
        void queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        toast("This checkout has ended. Start again from the item page.", "default");
      } else {
        toast("Could not restart payment.", "error", e);
      }
    }
  }

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
  const cancelled = data.status === "CANCELLED";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-primary">
        {pending ? (
          <Spinner />
        ) : cancelled ? (
          <X className="h-8 w-8" strokeWidth={2.5} />
        ) : (
          <Check className="h-8 w-8" strokeWidth={2.5} />
        )}
      </div>
      <div>
        <h1 className="text-2xl font-semibold">
          {pending
            ? "Processing payment…"
            : cancelled
              ? "Payment not completed"
              : "Order confirmed"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Order {data.id.slice(0, 8)} · {formatAed(data.totalAed)}
        </p>
        {pending ? (
          <p className="mt-2 text-sm text-muted">
            We&apos;re confirming your payment with Stripe. This usually takes a
            few seconds — if you left the payment page early, you can try again
            below.
          </p>
        ) : cancelled ? (
          <p className="mt-2 text-sm text-muted">
            You haven&apos;t been charged. This checkout has ended — start again
            from the item page.
          </p>
        ) : (
          <p className="mt-1 text-xs uppercase tracking-wide text-primary">
            {data.status.replaceAll("_", " ")}
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
          <Button
            variant="outline"
            className="w-full"
            disabled={retrying}
            onClick={() => void retryPayment()}
          >
            {retrying ? <Spinner className="h-4 w-4" /> : null}
            Retry payment
          </Button>
        </div>
      ) : null}

      {!cancelled ? (
        <Link href={`/orders/${data.id}`} className="w-full">
          <Button className="w-full">Track order</Button>
        </Link>
      ) : null}
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
