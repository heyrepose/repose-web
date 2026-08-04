"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, getErrorToastMessage } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/hooks";
import { useCart, type CartResponse } from "@/lib/cart";
import { formatAed, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Sheet } from "@/components/ui/sheet";
import { MockPaymentForm } from "@/components/checkout/mock-payment-form";
import { useToast } from "@/components/ui/toast";

type OrderCreate = {
  orderId: string;
  status: string;
  subtotalAed?: string;
  commissionAed?: string;
  totalAed: string;
  clientSecret: string;
};

type Address = {
  id: string;
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  emirate: string;
  isDefault?: boolean;
};

type ListingPreview = {
  id: string;
  title: string;
  priceAed: string;
  images?: Array<{ url: string }>;
  mainImageUrl?: string | null;
};

type PayConfig = {
  mode: "mock" | "stripe";
  publishableKey?: string | null;
};

function StripePaymentForm({
  orderId,
  totalAed,
}: {
  orderId: string;
  totalAed: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onPay() {
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation?orderId=${orderId}`,
      },
      redirect: "if_required",
    });
    if (stripeError) {
      const message = stripeError.message ?? "Payment failed";
      setError(message);
      toast(message, "error");
      setBusy(false);
      return;
    }
    toast("Payment successful", "success");
    router.push(`/checkout/confirmation?orderId=${orderId}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error ? <p className="text-sm text-muted">{error}</p> : null}
      <Button disabled={busy || !stripe} onClick={onPay} className="w-full">
        {busy ? <Spinner className="h-4 w-4" /> : null}
        Pay {formatAed(totalAed)}
      </Button>
    </div>
  );
}

function CheckoutInner() {
  const requireAuth = useRequireAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const listingIdParam = searchParams.get("listingId");
  const fromCart = searchParams.get("from") === "cart";

  const [step, setStep] = useState<"address" | "pay">("address");
  const [listing, setListing] = useState<ListingPreview | null>(null);
  const [cartSnapshot, setCartSnapshot] = useState<CartResponse | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderCreate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: "Home",
    line1: "",
    line2: "",
    city: "Dubai",
    emirate: "Dubai",
    isDefault: true,
  });

  const { data: cart } = useCart();
  const { data: payConfig } = useQuery({
    queryKey: ["payments", "config"],
    queryFn: () => apiFetch<PayConfig>("/payments/config"),
  });

  const stripePromise = useMemo(() => {
    if (payConfig?.mode !== "stripe" || !payConfig.publishableKey) return null;
    return loadStripe(payConfig.publishableKey);
  }, [payConfig]);

  const options = useMemo(
    () =>
      order?.clientSecret
        ? {
            clientSecret: order.clientSecret,
            appearance: {
              theme: "stripe" as const,
              variables: {
                colorPrimary: "#264A2E",
                colorBackground: "#FFFFFF",
                colorText: "#000000",
                borderRadius: "12px",
              },
            },
          }
        : undefined,
    [order?.clientSecret],
  );

  useEffect(() => {
    if (!requireAuth()) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const stored = sessionStorage.getItem("repose_checkout");
        if (stored) {
          const parsed = JSON.parse(stored) as OrderCreate;
          setOrder(parsed);
          setStep("pay");
          setLoading(false);
          return;
        }

        const addressList = await apiFetch<Address[]>("/addresses").catch(
          () => [] as Address[],
        );
        setAddresses(addressList);
        const def =
          addressList.find((a) => a.isDefault)?.id ??
          addressList[0]?.id ??
          null;
        setAddressId(def);

        if (fromCart) {
          const c =
            cart ?? (await apiFetch<CartResponse>("/cart").catch(() => null));
          if (!c || c.availableCount < 1) {
            setError("Your bag has no available items.");
            setLoading(false);
            return;
          }
          setCartSnapshot(c);
        } else {
          const id =
            listingIdParam ??
            (() => {
              try {
                const raw = sessionStorage.getItem("repose_checkout_listing");
                return raw
                  ? (JSON.parse(raw) as { listingId: string }).listingId
                  : null;
              } catch {
                return null;
              }
            })();

          if (!id) {
            setError("No listing selected for checkout.");
            setLoading(false);
            return;
          }

          const listingData = await apiFetch<ListingPreview>(`/listings/${id}`);
          setListing(listingData);
        }
      } catch (e) {
        setError(getErrorToastMessage(e, "Checkout failed."));
      } finally {
        setLoading(false);
      }
    }

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.id]);

  const listingIds = useMemo(() => {
    if (fromCart && cartSnapshot) {
      return cartSnapshot.groups.flatMap((g) =>
        g.items.filter((i) => i.isAvailable).map((i) => i.listingId),
      );
    }
    return listing ? [listing.id] : [];
  }, [fromCart, cartSnapshot, listing]);

  const displayTotal = fromCart
    ? cartSnapshot?.subtotalAed ?? "0"
    : listing?.priceAed ?? "0";

  async function createOrder() {
    if (!addressId || listingIds.length < 1) return;
    setCreating(true);
    setError(null);
    try {
      const created = await apiFetch<OrderCreate>("/orders", {
        method: "POST",
        body: JSON.stringify({ listingIds, addressId }),
      });
      sessionStorage.setItem("repose_checkout", JSON.stringify(created));
      setOrder(created);
      setStep("pay");
      toast("Order created — complete payment", "default");
    } catch (e) {
      const message = getErrorToastMessage(e, "Could not create order.");
      setError(message);
      toast("Could not create order.", "error", e);
    } finally {
      setCreating(false);
    }
  }

  async function saveAddress() {
    if (!addrForm.line1.trim()) return;
    try {
      const created = await apiFetch<Address>("/addresses", {
        method: "POST",
        body: JSON.stringify(addrForm),
      });
      const list = await apiFetch<Address[]>("/addresses");
      setAddresses(list);
      setAddressId(created.id);
      setAddOpen(false);
      setAddrForm((f) => ({ ...f, line1: "", line2: "" }));
      toast("Address saved", "success");
    } catch (e) {
      const message = getErrorToastMessage(e, "Could not save address.");
      setError(message);
      toast("Could not save address.", "error", e);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error && !listing && !cartSnapshot && !order) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="mt-4 text-sm text-muted">{error}</p>
        <Link href="/cart" className="mt-4 inline-block text-sm text-primary">
          Back to bag
        </Link>
      </div>
    );
  }

  const imageUrl =
    listing?.images?.[0]?.url ?? listing?.mainImageUrl ?? null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold">Checkout</h1>

      {listing ? (
        <div className="flex gap-3 rounded-card border border-card-border bg-surface p-3 shadow-card">
          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-card bg-accent-soft">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold">{listing.title}</p>
            <p className="mt-1 text-lg font-bold">
              {formatAed(listing.priceAed)}
            </p>
          </div>
        </div>
      ) : null}

      {fromCart && cartSnapshot ? (
        <ul className="flex flex-col gap-2">
          {cartSnapshot.groups.flatMap((g) =>
            g.items
              .filter((i) => i.isAvailable)
              .map((item) => (
                <li
                  key={item.listingId}
                  className="flex gap-3 rounded-card border border-card-border bg-surface p-3 text-sm shadow-card"
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
                    <p className="line-clamp-2 font-medium">
                      {item.listing.title}
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatAed(item.listing.priceAed ?? "0")}
                    </p>
                  </div>
                </li>
              )),
          )}
        </ul>
      ) : null}

      {step === "address" ? (
        <>
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Delivery address</h2>
              <button
                type="button"
                className="text-sm text-primary"
                onClick={() => setAddOpen(true)}
              >
                Add new
              </button>
            </div>
            {!addresses.length ? (
              <p className="rounded-card border border-card-border bg-surface p-4 text-sm text-muted">
                Add a delivery address to continue.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {addresses.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setAddressId(a.id)}
                      className={cn(
                        "w-full rounded-card border p-3 text-left text-sm",
                        addressId === a.id
                          ? "border-primary bg-accent-soft/40"
                          : "border-card-border bg-surface",
                      )}
                    >
                      <p className="font-medium">{a.label ?? "Address"}</p>
                      <p className="mt-1 text-muted">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}
                      </p>
                      <p className="text-muted">
                        {a.city}, {a.emirate}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="rounded-card border border-card-border bg-surface p-4 shadow-card">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span>{formatAed(displayTotal)}</span>
            </div>
            <p className="mt-2 text-xs text-muted">
              Platform commission is deducted from the seller — you pay the
              listed price. Payment is held until you confirm delivery.
            </p>
            <div className="mt-3 flex justify-between border-t border-card-border pt-3 text-base font-bold">
              <span>Total</span>
              <span>{formatAed(displayTotal)}</span>
            </div>
          </div>

          {error ? <p className="text-sm text-muted">{error}</p> : null}

          <Button
            className="w-full"
            disabled={!addressId || creating || listingIds.length < 1}
            onClick={createOrder}
          >
            {creating ? <Spinner className="h-4 w-4" /> : null}
            Continue to payment
          </Button>
        </>
      ) : order ? (
        <>
          <div className="rounded-card border border-card-border bg-surface p-4 shadow-card">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Order total</span>
              <span className="font-bold">{formatAed(order.totalAed)}</span>
            </div>
            <p className="mt-2 text-xs text-muted">
              Funds are held securely until you confirm receipt (or after 7 days
              of shipping).
            </p>
          </div>

          {payConfig?.mode === "mock" || !stripePromise || !options ? (
            <MockPaymentForm
              orderId={order.orderId}
              totalAed={order.totalAed}
            />
          ) : (
            <Elements stripe={stripePromise} options={options}>
              <StripePaymentForm
                orderId={order.orderId}
                totalAed={order.totalAed}
              />
            </Elements>
          )}
        </>
      ) : null}

      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add address"
        footer={
          <Button className="w-full" onClick={saveAddress}>
            Save address
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Label"
            value={addrForm.label}
            onChange={(e) =>
              setAddrForm({ ...addrForm, label: e.target.value })
            }
          />
          <Input
            label="Line 1"
            value={addrForm.line1}
            onChange={(e) =>
              setAddrForm({ ...addrForm, line1: e.target.value })
            }
          />
          <Input
            label="Line 2"
            value={addrForm.line2}
            onChange={(e) =>
              setAddrForm({ ...addrForm, line2: e.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={addrForm.city}
              onChange={(e) =>
                setAddrForm({ ...addrForm, city: e.target.value })
              }
            />
            <Input
              label="Emirate"
              value={addrForm.emirate}
              onChange={(e) =>
                setAddrForm({ ...addrForm, emirate: e.target.value })
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={addrForm.isDefault}
              onChange={(e) =>
                setAddrForm({ ...addrForm, isDefault: e.target.checked })
              }
            />
            Set as default
          </label>
        </div>
      </Sheet>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
