import { cn } from "@/lib/utils";

const STEPS = [
  "PENDING_PAYMENT",
  "PAID_HELD",
  "SHIPPED",
  "DELIVERED",
  "RELEASED",
] as const;

const LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Payment",
  PAID_HELD: "Paid",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  RELEASED: "Complete",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  DISPUTED: "Disputed",
};

export function OrderStatusTimeline({ status }: { status: string }) {
  const terminal = ["CANCELLED", "REFUNDED", "DISPUTED"].includes(status);
  const activeIdx = STEPS.indexOf(status as (typeof STEPS)[number]);

  if (terminal) {
    return (
      <div className="rounded-card border border-card-border bg-surface p-4 text-center shadow-card">
        <p className="text-sm font-semibold text-primary">
          {LABELS[status] ?? status}
        </p>
      </div>
    );
  }

  return (
    <ol className="flex items-start justify-between gap-1">
      {STEPS.map((step, i) => {
        const done = activeIdx >= i;
        const current = activeIdx === i;
        return (
          <li key={step} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              {i > 0 ? (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    activeIdx >= i ? "bg-primary" : "bg-card-border",
                  )}
                />
              ) : (
                <div className="flex-1" />
              )}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done
                    ? "bg-primary text-surface"
                    : "border border-card-border bg-surface text-muted",
                  current && "ring-2 ring-accent-soft ring-offset-2",
                )}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 ? (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    activeIdx > i ? "bg-primary" : "bg-card-border",
                  )}
                />
              ) : (
                <div className="flex-1" />
              )}
            </div>
            <span
              className={cn(
                "text-center text-[10px] font-medium",
                done ? "text-primary" : "text-muted",
              )}
            >
              {LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
