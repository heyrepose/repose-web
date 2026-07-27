"use client";

import { cn } from "@/lib/utils";

export function MessageBubble({
  body,
  mine,
}: {
  body: string;
  mine: boolean;
}) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-[16px] px-3.5 py-2.5 text-sm leading-relaxed",
          mine
            ? "rounded-br-sm bg-primary text-surface"
            : "rounded-bl-sm bg-accent-soft text-text",
        )}
      >
        {body}
      </div>
    </div>
  );
}
