import * as Toast from "@radix-ui/react-toast";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  subscribeToToasts,
  type ToastPayload,
  type ToastVariant,
} from "@/lib/toast";

type ActiveToast = Required<ToastPayload> & { open: boolean };

const stylesByVariant: Record<ToastVariant, string> = {
  info: "border-slate-200 bg-white text-slate-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

export function Toaster() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    return subscribeToToasts((toast) => {
      setToasts((current) => [...current.slice(-3), { ...toast, open: true }]);
    });
  }, []);

  return (
    <Toast.Provider swipeDirection="right">
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          open={toast.open}
          duration={4000}
          onOpenChange={(open) => {
            setToasts((current) =>
              current.map((item) => (item.id === toast.id ? { ...item, open } : item))
            );
            if (!open) {
              window.setTimeout(() => {
                setToasts((current) => current.filter((item) => item.id !== toast.id));
              }, 200);
            }
          }}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
            "relative w-[360px] rounded-xl border px-4 py-3 shadow-lg",
            stylesByVariant[toast.variant]
          )}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <Toast.Title className="text-sm font-semibold">{toast.title}</Toast.Title>
              {toast.description ? (
                <Toast.Description className="mt-1 text-sm opacity-90">
                  {toast.description}
                </Toast.Description>
              ) : null}
            </div>
            <Toast.Close className="rounded-md p-1 text-current/70 transition hover:bg-black/5 hover:text-current">
              x
            </Toast.Close>
          </div>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed right-4 top-4 z-[100] flex max-w-[100vw] flex-col gap-3 outline-none" />
    </Toast.Provider>
  );
}
