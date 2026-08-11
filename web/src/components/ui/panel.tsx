import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  if (!title && !description && !actions) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2",
        title ? "mb-3 border-b border-slate-200/80 pb-3" : "mb-2",
        className
      )}
    >
      {title || description ? (
        <div className="min-w-0">
          {title ? <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h2> : null}
          {description ? <p className="mt-0.5 text-[12px] text-slate-500">{description}</p> : null}
        </div>
      ) : (
        <div />
      )}
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-3.5 py-2.5">
          <div className="min-w-0">
            {title ? <h2 className="text-[13px] font-semibold text-slate-800">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{description}</p> : null}
          </div>
          {actions}
        </div>
      )}
      <div className={cn("p-3.5", bodyClassName)}>{children}</div>
    </section>
  );
}
