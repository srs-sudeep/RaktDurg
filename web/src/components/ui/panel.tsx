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
        "mb-3 flex flex-wrap items-center justify-between gap-2",
        className
      )}
    >
      {title || description ? (
        <div className="min-w-0">
          {title ? <h2 className="text-[14px] font-semibold text-slate-900">{title}</h2> : null}
          {description ? <p className="text-[12px] text-slate-500">{description}</p> : null}
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
    <section className={cn("surface-card", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
          <div className="min-w-0">
            {title ? <h2 className="text-[13px] font-semibold text-slate-800">{title}</h2> : null}
            {description ? <p className="text-[11px] text-slate-500">{description}</p> : null}
          </div>
          {actions}
        </div>
      )}
      <div className={cn("p-3", bodyClassName)}>{children}</div>
    </section>
  );
}
