"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  description?: string | null;
  condition: string;
};

export function DescriptionAccordion({ description, condition }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  // Consider it has flaws if it's Good or Satisfactory
  const hasFlaws = condition === "GOOD" || condition === "SATISFACTORY";

  if (!description && !hasFlaws) return null;

  return (
    <div className="mt-8 border-t border-card-border pt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 text-left transition-opacity hover:opacity-80 focus:outline-none"
      >
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text">
          Description
        </h3>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[1000px] opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"
        )}
      >
        {description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text/90">
            {description}
          </p>
        ) : null}

        {hasFlaws && (
          <div className="mt-6 rounded-card bg-surface p-4 border border-card-border">
            <h4 className="text-sm font-semibold text-primary mb-2">Show Flaws</h4>
            <p className="text-xs text-muted mb-3">
              This item is listed as {condition.replace(/_/g, " ").toLowerCase()}, meaning it shows signs of wear.
            </p>
            {/* Mocked flaw images for now, in a real app these would be specific photos */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              <div className="h-20 w-20 flex-shrink-0 rounded bg-bg animate-pulse"></div>
              <div className="h-20 w-20 flex-shrink-0 rounded bg-bg animate-pulse"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
