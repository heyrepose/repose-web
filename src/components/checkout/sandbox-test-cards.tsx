"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

const CARDS = [
  { number: "4242 4242 4242 4242", note: "Payment succeeds" },
  { number: "4000 0000 0000 0002", note: "Card is declined" },
  { number: "4000 0025 0000 3155", note: "Asks for 3-D Secure" },
  {
    number: "4000 0000 0000 0077",
    note: "Succeeds, funds available at once (for testing seller payouts)",
  },
] as const;

/**
 * Stripe's hosted payment page can't be pre-filled, so in development we show the sandbox
 * test cards here to copy. Never rendered in production builds.
 */
export function SandboxTestCards() {
  const [copied, setCopied] = useState<string | null>(null);

  if (process.env.NODE_ENV !== "development") return null;

  async function copy(number: string) {
    try {
      await navigator.clipboard.writeText(number.replaceAll(" ", ""));
      setCopied(number);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable — the number is still visible */
    }
  }

  return (
    <div className="rounded-card border border-dashed border-card-border bg-accent-soft/40 p-3 text-xs">
      <p className="font-semibold text-text">Stripe sandbox test cards (dev only)</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {CARDS.map((card) => (
          <li key={card.number} className="flex items-center justify-between gap-2">
            <span className="min-w-0">
              <span className="font-mono text-text">{card.number}</span>
              <span className="block text-muted">{card.note}</span>
            </span>
            <button
              type="button"
              onClick={() => void copy(card.number)}
              aria-label={`Copy ${card.number}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card border border-card-border bg-surface text-primary"
            >
              {copied === card.number ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-muted">
        Expiry: any future date · CVC: any 3 digits · ZIP: any
      </p>
    </div>
  );
}
