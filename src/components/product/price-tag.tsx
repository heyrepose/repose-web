import { formatAed, cn } from "@/lib/utils";

export function PriceTag({
  priceAed,
  className,
}: {
  priceAed: string | number;
  className?: string;
}) {
  return (
    <span className={cn("font-semibold text-text tabular-nums", className)}>
      {formatAed(priceAed)}
    </span>
  );
}
