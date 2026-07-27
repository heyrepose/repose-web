import { cn } from "@/lib/utils";

export function RareFindBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-surface",
        className,
      )}
    >
      Rare Find
    </span>
  );
}

export function SoldOverlay({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-text/45",
        className,
      )}
    >
      <span className="rounded-pill bg-surface px-4 py-1.5 text-sm font-bold tracking-widest text-text">
        SOLD
      </span>
    </div>
  );
}
