"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiFetch, getErrorToastMessage } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/hooks";
import { formatAed, cn } from "@/lib/utils";
import { SandboxTestCards } from "@/components/checkout/sandbox-test-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";

type OrderCreate = {
  orderId: string;
  status: string;
  subtotalAed?: string;
  commissionAed?: string;
  totalAed: string;
  /** Stripe-hosted Checkout page to send the buyer to. */
  checkoutUrl: string;
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
  status?: string;
  images?: Array<{ url: string }>;
  mainImageUrl?: string | null;
};

function CheckoutInner() {
  const requireAuth = useRequireAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const listingIdParam = searchParams.get("listingId");
  // Stripe sends the buyer back here (cancel_url) if they leave the payment page.
  const canceled = searchParams.get("canceled") === "1";

  const [step, setStep] = useState<"address" | "pay">("address");
  const [listing, setListing] = useState<ListingPreview | null>(null);
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

  useEffect(() => {
    if (!requireAuth()) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        // Older builds kept an in-page card form's state here; payment now lives on Stripe.
        sessionStorage.removeItem("repose_checkout");

        const addressList = await apiFetch<Address[]>("/addresses").catch(
          () => [] as Address[],
        );
        setAddresses(addressList);
        const def =
          addressList.find((a) => a.isDefault)?.id ??
          addressList[0]?.id ??
          null;
        setAddressId(def);

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
          setError(
            "No item selected. Open your bag and checkout one product at a time.",
          );
          setLoading(false);
          return;
        }

        const listingData = await apiFetch<ListingPreview>(`/listings/${id}`);
        if (listingData.status && listingData.status !== "ACTIVE") {
          setError("This listing is no longer available.");
          setLoading(false);
          return;
        }
        setListing(listingData);
        sessionStorage.setItem(
          "repose_checkout_listing",
          JSON.stringify({
            listingId: listingData.id,
            priceAed: listingData.priceAed,
          }),
        );
      } catch (e) {
        setError(getErrorToastMessage(e, "Checkout failed."));
      } finally {
        setLoading(false);
      }
    }

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingIdParam]);

  async function createOrder() {
    if (!addressId || !listing) return;
    setCreating(true);
    setError(null);
    try {
      // P2P: exactly one listing per order
      const created = await apiFetch<OrderCreate>("/orders", {
        method: "POST",
        body: JSON.stringify({
          listingIds: [listing.id],
          addressId,
        }),
      });
      setOrder(created);
      setStep("pay");
      // Payment happens on Stripe's hosted page; the webhook (not this redirect) confirms it.
      window.location.assign(created.checkoutUrl);
    } catch (e) {
      const message = getErrorToastMessage(e, "Could not start payment.");
      setError(message);
      toast("Could not start payment.", "error", e);
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

  if (error && !listing && !order) {
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
  const displayTotal = listing?.priceAed ?? order?.totalAed ?? "0";

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="mt-1 text-sm text-muted">
          One listing per order — pay and ship with that seller only.
        </p>
      </div>

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

      {step === "address" ? (
        <>
          {canceled ? (
            <p className="rounded-card border border-card-border bg-accent-soft/40 px-3 py-2 text-sm text-muted">
              Payment was cancelled — you haven&apos;t been charged. Choose an
              address to try again.
            </p>
          ) : null}
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
              <span className="text-muted">Item price</span>
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

          <SandboxTestCards />

          {error ? <p className="text-sm text-muted">{error}</p> : null}

          <Button
            className="w-full"
            disabled={!addressId || creating || !listing}
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

          <div className="flex flex-col items-center gap-3 text-center">
            <Spinner />
            <p className="text-sm text-muted">
              Taking you to our secure payment page…
            </p>
            <a
              href={order.checkoutUrl}
              className="text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              Not redirected? Continue to payment
            </a>
          </div>
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
