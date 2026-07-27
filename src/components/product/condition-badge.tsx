import type { ListingCondition } from "@repose/api-types";
import { CONDITION_BADGE, type ListingConditionKey } from "@repose/ui";
import { Badge } from "@/components/ui/badge";

export function ConditionBadge({
  condition,
}: {
  condition: ListingCondition | string;
}) {
  const style =
    CONDITION_BADGE[condition as ListingConditionKey] ??
    CONDITION_BADGE.GOOD;

  return (
    <Badge
      style={{
        backgroundColor: style.bg,
        color: style.fg,
        border: style.border ? `1px solid ${style.border}` : undefined,
      }}
    >
      {style.label}
    </Badge>
  );
}
