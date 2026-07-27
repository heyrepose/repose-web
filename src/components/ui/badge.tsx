import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { style?: CSSProperties }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
}
