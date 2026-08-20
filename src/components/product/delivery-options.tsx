"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { id: "repose-shipping", label: "Repose Shipping" },
  { id: "buyer-collection", label: "Buyer Collection" },
  { id: "meet-up", label: "Meet up" },
];

export function DeliveryOptions() {
  const [selected, setSelected] = useState(OPTIONS[0].id);

  return (
    <div className="mt-4 flex flex-col gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-text">
        Delivery Method
      </h3>
      <div className="flex flex-wrap gap-2 mt-2">
        {OPTIONS.map((option) => {
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setSelected(option.id)}
              className={cn(
                "rounded-pill px-4 py-2 text-sm font-medium transition-all duration-200 border",
                isSelected
                  ? "bg-primary text-surface border-primary"
                  : "bg-bg text-text/80 border-transparent hover:bg-accent-soft hover:text-primary"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
