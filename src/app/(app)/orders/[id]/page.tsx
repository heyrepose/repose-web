"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatAed, cn } from "@/lib/utils";
import { getChatSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import { LeaveReview } from "@/components/orders/leave-review";
import { useAuth } from "@/lib/hooks";
import { MessageCircle, ShieldCheck } from "lucide-react";

type OrderDetail = {
  id: string;
  status: string;
  buyerId?: string;
  subtotalAed: string;
  commissionAed: string;
  totalAed: string;
  items: Array<{
    sellerId?: string;
    listing: { id: string; title: string; mainImageUrl?: string | null };
    priceAed: string;
  }>;
  address?: {
    name?: string | null;
    line1: string;
    city: string;
    emirate: string;
    phone?: string | null;
  };
  courierName?: string | null;
  trackingNumber?: string | null;
  statusHistory?: Array<{ status: string; createdAt: string }>;
  paidAt?: string | null;
  shipByAt?: string | null;
  shipTimeoutDays?: number;
};

const COURIERS = ["Aramex", "Emirates Post", "Fetchr", "Quiqup", "Other"];

const DISPUTE_REASONS = [
  { value: "ITEM_NOT_AS_DESCRIBED", label: "Not as described" },
  { value: "ITEM_NOT_RECEIVED", label: "Not received" },
  { value: "ITEM_DAMAGED", label: "Damaged" },
  { value: "WRONG_ITEM", label: "Wrong item" },
  { value: "OTHER", label: "Other" },
] as const;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] =
    useState<(typeof DISPUTE_REASONS)[number]["value"]>("ITEM_NOT_AS_DESCRIBED");
  const [disputeNote, setDisputeNote] = useState("");

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: () => apiFetch<OrderDetail>(`/orders/${id}`),
  });

  const {
    data: wallet,
    isLoading: walletLoading,
  } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => apiFetch<{ onboardingComplete: boolean }>("/wallet"),
    enabled: Boolean(user?.id),
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
    onError: (e) => {
      if (
        e instanceof ApiError &&
        e.errorCode === "WALLET_ONBOARDING_INCOMPLETE"
      ) {
        toast("Complete payout setup before shipping", "error", e);
        return;
      }
      toast("Could not ship", "error", e);
    },
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
      toast("Could not confirm", "error", e),
  });

  const dispute = useMutation({
    mutationFn: () =>
      apiFetch(`/orders/${id}/dispute`, {
        method: "POST",
        body: JSON.stringify({
          reason: disputeReason,
          note: disputeNote || undefined,
        }),
      }),
    onSuccess: () => {
      setDisputeOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["order", id] });
      toast("Dispute opened — we'll review this order", "success");
    },
    onError: (e) =>
      toast("Could not open dispute", "error", e),
  });

  const messageOther = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("No order");
      const listingId = order.items[0]?.listing.id;
      if (!listingId) throw new Error("No listing");
      const isBuyer = user?.id === order.buyerId;
      const sellerId = order.items[0]?.sellerId;
      if (isBuyer) {
        return apiFetch<{ id: string }>("/conversations", {
          method: "POST",
          body: JSON.stringify({ listingId, sellerId }),
        });
      }
      return apiFetch<{ id: string }>("/conversations", {
        method: "POST",
        body: JSON.stringify({
          listingId,
          buyerId: order.buyerId,
        }),
      });
    },
    onSuccess: (conv) => {
      toast("Opening chat…", "default");
      router.push(`/messages/${conv.id}`);
    },
    onError: (e) =>
      toast("Could not open chat", "error", e),
  });

  const shipHint = useMemo(() => {
    if (!order?.shipByAt || order.status !== "PAID_HELD") return null;
    const by = new Date(order.shipByAt);
    const now = Date.now();
    const msLeft = by.getTime() - now;
    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
    if (msLeft < 0) {
      return {
        overdue: true,
        label: `Shipping overdue since ${by.toLocaleDateString()}`,
      };
    }
    return {
      overdue: false,
      label:
        daysLeft <= 1
          ? `Ship by today (${by.toLocaleDateString()})`
          : `Ship within ${daysLeft} days · by ${by.toLocaleDateString()}`,
    };
  }, [order]);

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
  const canDispute =
    (isBuyer || isSeller) &&
    ["PAID_HELD", "SHIPPED", "DELIVERED"].includes(order.status);

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

      {isSeller && shipHint ? (
        <div
          className={cn(
            "rounded-card border p-4 text-sm",
            shipHint.overdue
              ? "border-text bg-accent-soft/60"
              : "border-card-border bg-accent-soft/40",
          )}
        >
          <p className="font-semibold text-primary">{shipHint.label}</p>
          <p className="mt-1 text-muted">
            Buyers expect prompt shipping. You&apos;ll get reminder
            notifications as the window closes.
          </p>
        </div>
      ) : null}

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

      {(isBuyer || isSeller) && order.items[0]?.listing.id ? (
        <Button
          variant="outline"
          className="w-full"
          disabled={messageOther.isPending}
          onClick={() => messageOther.mutate()}
        >
          <MessageCircle className="h-4 w-4" />
          {isSeller ? "Message buyer" : "Message seller"}
        </Button>
      ) : null}

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
            {[order.address.name, order.address.line1, order.address.city, order.address.emirate]
              .filter(Boolean)
              .join(", ")}
          </p>
          {order.address.phone ? (
            <p className="mt-1 text-muted">{order.address.phone}</p>
          ) : null}
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
          {walletLoading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : wallet && !wallet.onboardingComplete ? (
            <div className="rounded-card border border-card-border bg-accent-soft/40 p-3 text-sm">
              <p className="font-medium text-primary">Payout setup required</p>
              <p className="mt-1 text-muted">
                Complete wallet onboarding before you can mark this as shipped.
              </p>
              <Link href="/profile/wallet" className="mt-3 inline-block">
                <Button size="sm">Go to wallet</Button>
              </Link>
            </div>
          ) : (
            <>
              <div>
                <p className="mb-2 text-xs font-medium text-muted">Courier</p>
                <div className="flex flex-wrap gap-2">
                  {COURIERS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCourierName(c === "Other" ? "" : c)}
                      className={cn(
                        "rounded-pill border px-3 py-1.5 text-xs font-medium",
                        courierName === c || (c === "Other" && !COURIERS.slice(0, -1).includes(courierName) && courierName)
                          ? "border-primary bg-primary text-surface"
                          : "border-card-border bg-surface text-muted",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label="Courier name"
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
            </>
          )}
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

      {canDispute ? (
        <Button variant="outline" onClick={() => setDisputeOpen(true)}>
          Open a dispute
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

      <Sheet
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        title="Open a dispute"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Pausing payout while we review. Prefer messaging the other party
            first when you can.
          </p>
          <div className="flex flex-col gap-2">
            {DISPUTE_REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setDisputeReason(r.value)}
                className={cn(
                  "rounded-card border px-3 py-2.5 text-left text-sm",
                  disputeReason === r.value
                    ? "border-primary bg-accent-soft text-primary"
                    : "border-card-border bg-surface",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Input
            label="Note (optional)"
            value={disputeNote}
            onChange={(e) => setDisputeNote(e.target.value)}
          />
          <Button
            disabled={dispute.isPending}
            onClick={() => dispute.mutate()}
          >
            {dispute.isPending ? <Spinner className="h-4 w-4" /> : null}
            Submit dispute
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
