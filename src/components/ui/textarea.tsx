import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <label className="flex flex-col gap-2 w-full">
        {label ? (
          <span className="text-sm font-medium text-text">{label}</span>
        ) : null}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "min-h-[120px] w-full rounded-card border border-card-border bg-surface px-3 py-3 text-sm text-text placeholder:text-muted outline-none focus:border-primary resize-y",
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
Textarea.displayName = "Textarea";
