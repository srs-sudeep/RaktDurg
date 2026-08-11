import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg border text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-red-700 bg-red-700 text-white hover:bg-red-800",
        outline: "border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50",
        ghost: "border-transparent bg-transparent text-slate-700 hover:bg-slate-100",
        secondary: "border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 px-3 text-[12px]",
        lg: "h-10 px-4",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
