"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatAed } from "@/lib/utils";
import { getChatSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import { LeaveReview } from "@/components/orders/leave-review";
import { useAuth } from "@/lib/hooks";
import { ShieldCheck } from "lucide-react";

type OrderDetail = {
  id: string;
  status: string;
  buyerId?: string;
  sellerId?: string;
  subtotalAed: string;
  commissionAed: string;
  totalAed: string;
  items: Array<{
    sellerId?: string;
    listing: { id: string; title: string; mainImageUrl?: string | null };
    priceAed: string;
  }>;
  address?: { line1: string; city: string; emirate: string };
  courierName?: string | null;
  trackingNumber?: string | null;
  statusHistory?: Array<{ status: string; createdAt: string }>;
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: () => apiFetch<OrderDetail>(`/orders/${id}`),
  });

  useEffect(() => {
    const socket = getChatSocket();
    if (!socket) return;
    const handler = (payload: { orderId?: string }) => {
      if (payload.orderId === id) {
        void queryClient.invalidateQueries({ queryKey: ["order", id] });
        void queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
    };
    socket.on("order:status_changed", handler);
    return () => {
      socket.off("order:status_changed", handler);
    };
  }, [id, queryClient]);

  const ship = useMutation({
    mutationFn: () =>
      apiFetch(`/orders/${id}/ship`, {
        method: "PATCH",
        body: JSON.stringify({ courierName, trackingNumber }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      setShipOpen(false);
      toast("Marked as shipped", "success");
    },
    onError: (e) =>
      toast(e instanceof ApiError ? e.message : "Could not ship", "error"),
  });

  const confirm = useMutation({
    mutationFn: () =>
      apiFetch(`/orders/${id}/confirm-receipt`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      setConfirmOpen(false);
      toast("Receipt confirmed", "success");
    },
    onError: (e) =>
      toast(e instanceof ApiError ? e.message : "Could not confirm", "error"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error || !order) {
    return <p className="text-sm text-muted">Order not found.</p>;
  }

  const isBuyer = Boolean(user?.id && order.buyerId === user.id);
  const sellerIds = new Set(
    order.items?.map((i) => i.sellerId).filter(Boolean) as string[],
  );
  const isSeller = Boolean(user?.id && sellerIds.has(user.id));
  const canReview =
    isBuyer &&
    (order.status === "DELIVERED" || order.status === "RELEASED");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-wide text-muted">
          Order {order.id.slice(0, 8)}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">
          {formatAed(order.totalAed)}
        </h1>
      </header>

      <OrderStatusTimeline status={order.status} />

      {isBuyer ? (
        <div className="flex gap-3 rounded-card border border-card-border bg-accent-soft/40 p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-primary">Buyer protection</p>
            <p className="mt-1 text-muted">
              Your payment is held until you confirm receipt. If you stay
              silent after shipping, delivery auto-confirms after 7 days.
            </p>
          </div>
        </div>
      ) : null}

      <ul className="flex flex-col gap-2">
        {order.items?.map((item, i) => (
          <li
            key={i}
            className="flex gap-3 rounded-card border border-card-border bg-surface p-3 shadow-card"
          >
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-card bg-accent-soft">
              {item.listing.mainImageUrl ? (
                <Image
                  src={item.listing.mainImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium">
                {item.listing.title}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {formatAed(item.priceAed)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {order.courierName || order.trackingNumber ? (
        <div className="rounded-card border border-card-border bg-surface p-4 text-sm shadow-card">
          <p className="font-semibold">Shipping</p>
          {order.courierName ? (
            <p className="mt-1 text-muted">{order.courierName}</p>
          ) : null}
          {order.trackingNumber ? (
            <p className="font-medium text-primary">{order.trackingNumber}</p>
          ) : null}
        </div>
      ) : null}

      {order.address ? (
        <div className="rounded-card border border-card-border bg-surface p-4 text-sm shadow-card">
          <p className="font-semibold">Delivery</p>
          <p className="mt-1 text-muted">
            {order.address.line1}, {order.address.city}, {order.address.emirate}
          </p>
        </div>
      ) : null}

      {order.statusHistory?.length ? (
        <div>
          <h2 className="mb-2 text-sm font-semibold">Timeline</h2>
          <ol className="space-y-2 border-l border-card-border pl-4">
            {order.statusHistory.map((h, i) => (
              <li key={i} className="relative text-xs text-muted">
                <span className="absolute -left-[1.15rem] top-1 h-2 w-2 rounded-full bg-primary" />
                <span className="font-medium text-text">
                  {h.status.replaceAll("_", " ")}
                </span>
                <br />
                {new Date(h.createdAt).toLocaleString()}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {order.status === "PAID_HELD" && isSeller ? (
        <div className="flex flex-col gap-3 rounded-card border border-card-border bg-surface p-4 shadow-card">
          <p className="text-sm font-semibold">Ship this order</p>
          <Input
            label="Courier"
            value={courierName}
            onChange={(e) => setCourierName(e.target.value)}
          />
          <Input
            label="Tracking number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
          <Button
            disabled={ship.isPending || !courierName || !trackingNumber}
            onClick={() => setShipOpen(true)}
          >
            Mark shipped
          </Button>
        </div>
      ) : null}

      {order.status === "SHIPPED" && isBuyer ? (
        <Button
          disabled={confirm.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          Confirm receipt
        </Button>
      ) : null}

      {canReview ? <LeaveReview orderId={order.id} /> : null}

      <ConfirmDialog
        open={shipOpen}
        onClose={() => setShipOpen(false)}
        onConfirm={() => ship.mutate()}
        title="Mark as shipped?"
        description={`${courierName} · ${trackingNumber}. The buyer will be notified.`}
        confirmLabel="Ship order"
        busy={ship.isPending}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => confirm.mutate()}
        title="Confirm receipt?"
        description="This releases payment to the seller. Only confirm once you’ve received the item."
        confirmLabel="Confirm receipt"
        busy={confirm.isPending}
      />
    </div>
  );
}
