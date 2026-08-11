import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[13px] shadow-sm placeholder:text-slate-400 focus-visible:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/20",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";
