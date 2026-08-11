import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const controlClass =
  "flex h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[13px] text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export const FormInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input className={cn(controlClass, className)} ref={ref} {...props} />
  )
);
FormInput.displayName = "FormInput";

export const FormSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select className={cn(controlClass, "pr-8", className)} ref={ref} {...props}>
      {children}
    </select>
  )
);
FormSelect.displayName = "FormSelect";

export const FormTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        controlClass,
        "min-h-[72px] py-2",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
FormTextarea.displayName = "FormTextarea";

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={htmlFor} className="text-[12px] font-medium text-slate-600">
        {label}
        {required ? <span className="ml-0.5 text-red-600">*</span> : null}
      </Label>
      {children}
      {hint && !error ? <p className="text-[11px] text-slate-400">{hint}</p> : null}
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}

export function FormGrid({
  cols = 2,
  className,
  children,
}: {
  cols?: 1 | 2 | 3 | 4;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 sm:grid-cols-2",
        cols === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function FormActions({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3", className)}>
      {children}
    </div>
  );
}
