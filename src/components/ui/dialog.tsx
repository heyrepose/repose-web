"use client";

import {
  useEffect,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  /** Primary / secondary action row */
  footer?: ReactNode;
};

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
  footer,
}: DialogProps) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "dialog-title" : undefined}
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-text/40 animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-card bg-surface p-5 shadow-card animate-scale-in",
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          {title ? (
            <h2 id="dialog-title" className="text-lg font-semibold text-text">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="text-sm text-text">{children}</div>
        {footer ? <div className="mt-5 flex gap-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export function DialogActions({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex w-full flex-col-reverse gap-2 sm:flex-row", className)}
      {...props}
    />
  );
}
