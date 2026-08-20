import { formatAed, cn } from "@/lib/utils";

export function PriceTag({
  priceAed,
  className,
}: {
  priceAed: string | number;
  className?: string;
}) {
  const formatted = formatAed(priceAed);
  const numeral = formatted.replace(/^AED\s*/i, "");

  return (
    <span className={cn("inline-flex items-baseline gap-1 text-text", className)}>
      <span className="text-[0.65em] font-medium uppercase tracking-tight">
        AED
      </span>
      <span className="font-bold tracking-tighter tabular-nums">
        {numeral}
      </span>
    </span>
  );
}
