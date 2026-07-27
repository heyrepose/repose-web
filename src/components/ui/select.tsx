"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, error, id, options, placeholder, ...props },
    ref,
  ) => {
    const selectId = id ?? props.name;
    return (
      <label className="flex w-full flex-col gap-2">
        {label ? (
          <span className="text-sm font-medium text-text">{label}</span>
        ) : null}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "min-h-[44px] w-full appearance-none rounded-card border border-card-border bg-surface px-3 pr-10 text-sm text-text outline-none focus:border-primary",
              error && "border-text",
              className,
            )}
            {...props}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
        {error ? <span className="text-xs text-muted">{error}</span> : null}
      </label>
    );
  },
);
Select.displayName = "Select";
