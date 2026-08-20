import type { ListingCondition } from "@repose/api-types";

const CONDITION_CONFIG: Record<
  ListingCondition | string,
  { label: string; bg: string; fg: string; desc: string }
> = {
  NEW_WITH_TAGS: {
    label: "New with Tags",
    bg: "#264a2e", // forest green
    fg: "#ffffff",
    desc: "Unworn with original tags attached.",
  },
  NEW_WITHOUT_TAGS: {
    label: "New without Tags",
    bg: "#d6e4da", // sage tone
    fg: "#264a2e",
    desc: "Unworn but missing original tags.",
  },
  VERY_GOOD: {
    label: "Very Good",
    bg: "#8a9a5b", // warm olive
    fg: "#ffffff",
    desc: "Lightly worn, minor signs of wear.",
  },
  GOOD: {
    label: "Good",
    bg: "#888888", // warm gray
    fg: "#ffffff",
    desc: "Regular wear, moderate signs of use.",
  },
  SATISFACTORY: {
    label: "Satisfactory",
    bg: "#8b7355", // muted brown
    fg: "#ffffff",
    desc: "Noticeable wear or minor flaws.",
  },
};

export function ConditionBadge({
  condition,
}: {
  condition: ListingCondition | string;
}) {
  const config = CONDITION_CONFIG[condition] ?? CONDITION_CONFIG.GOOD;

  return (
    <div className="group relative flex items-center">
      <div className="relative flex items-center justify-center rounded-full bg-accent-soft px-4 h-10 font-sans text-xs font-bold uppercase tracking-wider text-primary">
        {config.label}
        <span
          className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full text-muted transition-colors hover:text-text cursor-help"
          title="Info"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
          </svg>
        </span>
      </div>
      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-text px-3 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
        {config.desc}
        <div className="absolute left-1/2 top-full -mt-[1px] h-0 w-0 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-text"></div>
      </div>
    </div>
  );
}
