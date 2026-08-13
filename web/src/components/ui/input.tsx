import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

/** Shared control chrome — Form* components import the same shape. */
export const controlClassName =
  "flex h-9 w-full rounded-lg border border-input bg-card px-3 text-[13px] text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input type={type} className={cn(controlClassName, className)} ref={ref} {...props} />
  )
);
Input.displayName = "Input";
