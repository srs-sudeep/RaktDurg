import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-8 w-full rounded border border-slate-300 bg-white px-2.5 text-[13px] shadow-none placeholder:text-slate-400 focus-visible:border-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";
