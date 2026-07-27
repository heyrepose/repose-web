"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Max height of sheet body */
  side?: "bottom" | "right";
};

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  side = "bottom",
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const isBottom = side === "bottom";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close sheet"
        className="absolute inset-0 bg-text/40 animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute z-10 flex flex-col bg-bg shadow-card",
          isBottom
            ? "inset-x-0 bottom-0 max-h-[90vh] rounded-t-[20px] animate-sheet-up"
            : "inset-y-0 right-0 h-full w-full max-w-md animate-sheet-right sm:rounded-l-card",
          className,
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-card-border px-4 py-4">
          {isBottom ? (
            <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-pill bg-card-border" />
          ) : null}
          <h2 className={cn("text-lg font-semibold", isBottom && "mt-2")}>
            {title}
          </h2>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-card-border bg-surface px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
