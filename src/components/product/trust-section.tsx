import { ShieldCheck } from "lucide-react";

export function TrustSection() {
  return (
    <div className="mt-4 flex items-start gap-2 border-t border-card-border/50 pt-4">
      <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <p className="text-xs text-muted leading-tight">
        <strong className="text-text font-semibold">Trust starts with transparency.</strong> Every item is carefully verified for authenticity and condition before it reaches you.
      </p>
    </div>
  );
}
