import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <label className="flex flex-col gap-2 w-full">
        {label ? (
          <span className="text-sm font-medium text-text">{label}</span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "min-h-[44px] w-full rounded-card border border-card-border bg-surface px-3 text-sm text-text placeholder:text-muted outline-none focus:border-primary",
            error && "border-text",
            className,
          )}
          {...props}
        />
        {error ? <span className="text-xs text-muted">{error}</span> : null}
      </label>
    );
  },
);
Input.displayName = "Input";
