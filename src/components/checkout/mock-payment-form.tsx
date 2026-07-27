"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatAed } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

type Props = {
  orderId: string;
  totalAed: string;
};

function detectBrand(digits: string): string {
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  return "Card";
}

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** Test cards shown in the mock payment UI. */
export const MOCK_TEST_CARDS = {
  success: "4242424242424242",
  decline: "4000000000000002",
} as const;

export function MockPaymentForm({ orderId, totalAed }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = number.replace(/\D/g, "");
  const brand = useMemo(() => detectBrand(digits), [digits]);

  async function onPay() {
    setError(null);
    if (digits.length < 15) {
      setError("Enter a valid card number.");
      return;
    }
    if (expiry.replace(/\D/g, "").length < 4) {
      setError("Enter a valid expiry.");
      return;
    }
    if (cvc.replace(/\D/g, "").length < 3) {
      setError("Enter a valid CVC.");
      return;
    }
    if (!name.trim()) {
      setError("Enter the name on card.");
      return;
    }

    const outcome =
      digits === MOCK_TEST_CARDS.decline ? "DECLINED" : "SUCCESS";

    setBusy(true);
    await new Promise((r) => setTimeout(r, 1500));

    try {
      await apiFetch("/payments/dev/confirm", {
        method: "POST",
        body: JSON.stringify({ orderId, outcome }),
      });
      if (outcome === "DECLINED") {
        const message = "Your card was declined. Try another card.";
        setError(message);
        toast(message, "error");
        setBusy(false);
        return;
      }
      toast("Payment successful", "success");
      router.push(`/checkout/confirmation?orderId=${orderId}`);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Payment failed";
      setError(message);
      toast(message, "error");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-card-border bg-accent-soft/40 p-3 text-xs text-muted">
        <p className="font-semibold text-text">Test cards (mock payment)</p>
        <p className="mt-1">
          Success:{" "}
          <button
            type="button"
            className="font-medium text-primary underline"
            onClick={() => setNumber(formatCardNumber(MOCK_TEST_CARDS.success))}
          >
            4242 4242 4242 4242
          </button>
        </p>
        <p>
          Decline:{" "}
          <button
            type="button"
            className="font-medium text-primary underline"
            onClick={() => setNumber(formatCardNumber(MOCK_TEST_CARDS.decline))}
          >
            4000 0000 0000 0002
          </button>
        </p>
      </div>

      <div className="rounded-card border border-card-border bg-surface p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Card details</p>
          <span className="text-xs text-muted">{brand}</span>
        </div>
        <div className="flex flex-col gap-3">
          <Input
            label="Card number"
            inputMode="numeric"
            autoComplete="cc-number"
            value={number}
            onChange={(e) => setNumber(formatCardNumber(e.target.value))}
            placeholder="4242 4242 4242 4242"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expiry"
              inputMode="numeric"
              autoComplete="cc-exp"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
            />
            <Input
              label="CVC"
              inputMode="numeric"
              autoComplete="cc-csc"
              value={cvc}
              onChange={(e) =>
                setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="123"
            />
          </div>
          <Input
            label="Name on card"
            autoComplete="cc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-muted">{error}</p> : null}

      <Button className="w-full" disabled={busy} onClick={onPay}>
        {busy ? <Spinner className="h-4 w-4" /> : null}
        {busy ? "Processing…" : `Pay ${formatAed(totalAed)}`}
      </Button>
    </div>
  );
}
