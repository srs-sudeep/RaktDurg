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
  // Shell owns the page title — never render a title-less strip.
  if (!title && !description) return null;

  return (
    <div className={cn("mb-4 flex flex-wrap items-center justify-between gap-2", className)}>
      <div className="min-w-0">
        {title ? (
          <h2 className="font-sans text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
        ) : null}
        {description ? <p className="text-[12px] text-muted-foreground">{description}</p> : null}
      </div>
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
  flush,
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn("surface-card", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="font-sans text-[14px] font-semibold tracking-tight text-foreground">{title}</h2>
            ) : null}
            {description ? <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p> : null}
          </div>
          {actions}
        </div>
      )}
      <div className={cn(flush ? "p-0" : "p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
