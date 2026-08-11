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
        "flex flex-wrap items-center justify-between gap-3",
        title ? "mb-4 border-b border-slate-200/70 pb-3.5" : "mb-2",
        className
      )}
    >
      {title || description ? (
        <div className="min-w-0">
          {title ? (
            <h2 className="font-display text-[16px] font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
          ) : null}
          {description ? <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500">{description}</p> : null}
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100/90 bg-gradient-to-r from-slate-50/90 via-white to-white px-4 py-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="font-display text-[13.5px] font-semibold tracking-tight text-slate-800">
                {title}
              </h2>
            ) : null}
            {description ? <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500">{description}</p> : null}
          </div>
          {actions}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
