"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getErrorToastMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type ToastItem = {
  id: string;
  message: string;
  variant?: "default" | "success" | "error";
};

type ToastContextValue = {
  /**
   * Show a toast. For errors, pass the caught value as `cause` so development
   * builds include the full API message, errorCode, and details.
   */
  toast: (
    message: string,
    variant?: ToastItem["variant"],
    cause?: unknown,
  ) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const IS_DEV = process.env.NODE_ENV === "development";

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback(
    (
      message: string,
      variant: ToastItem["variant"] = "default",
      cause?: unknown,
    ) => {
      const text =
        variant === "error" && cause !== undefined
          ? getErrorToastMessage(cause, message)
          : message;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration =
        variant === "error" && IS_DEV ? 12_000 : variant === "error" ? 5000 : 3200;
      setItems((prev) => [...prev, { id, message: text, variant }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    [],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-8"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-pill px-4 py-3 text-sm shadow-card animate-fade-in",
              item.variant === "error" && IS_DEV
                ? "max-w-lg whitespace-pre-wrap break-words text-left rounded-card"
                : "max-w-sm",
              item.variant === "success" && "bg-primary text-surface",
              item.variant === "error" && "bg-text text-surface",
              item.variant === "default" &&
                "bg-surface text-text border border-card-border",
            )}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (message: string, _variant?: ToastItem["variant"], cause?: unknown) => {
        if (typeof window !== "undefined") {
          console.info("[toast]", message, cause);
        }
      },
    };
  }
  return ctx;
}
