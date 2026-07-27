import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-opacity disabled:opacity-50 disabled:pointer-events-none text-sm",
  {
    variants: {
      variant: {
        primary:
          "rounded-pill bg-primary text-surface hover:opacity-90 min-h-[52px] px-6",
        secondary:
          "rounded-pill bg-accent-soft text-primary hover:opacity-90 min-h-[52px] px-6",
        outline:
          "rounded-pill border border-card-border bg-surface text-text hover:bg-accent-soft/40 min-h-[52px] px-6",
        ghost:
          "rounded-card bg-transparent text-text hover:bg-accent-soft/50 min-h-[44px] px-4",
        soft: "rounded-pill bg-surface text-primary border border-primary/20 hover:bg-accent-soft min-h-[52px] px-6",
      },
      size: {
        default: "",
        sm: "min-h-[40px] px-4 text-xs",
        lg: "min-h-[56px] px-8 text-base",
        icon: "h-11 w-11 min-h-0 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
