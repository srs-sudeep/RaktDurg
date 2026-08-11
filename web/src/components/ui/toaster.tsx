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
  info: "border-slate-300 bg-white text-slate-900",
  success: "border-emerald-600 bg-emerald-50 text-emerald-950",
  error: "border-red-600 bg-red-50 text-red-950",
};

export function Toaster() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    return subscribeToToasts((toast) => {
      setToasts((current) => [...current.slice(-4), { ...toast, open: true }]);
    });
  }, []);

  return (
    <Toast.Provider swipeDirection="right" duration={3500}>
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          open={toast.open}
          onOpenChange={(open) => {
            setToasts((current) =>
              current.map((item) => (item.id === toast.id ? { ...item, open } : item))
            );
            if (!open) {
              window.setTimeout(() => {
                setToasts((current) => current.filter((item) => item.id !== toast.id));
              }, 180);
            }
          }}
          className={cn(
            "relative w-[340px] rounded border px-3 py-2.5 shadow-md",
            stylesByVariant[toast.variant]
          )}
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <Toast.Title className="text-[13px] font-semibold">{toast.title}</Toast.Title>
              {toast.description ? (
                <Toast.Description className="mt-0.5 text-[12px] opacity-90">
                  {toast.description}
                </Toast.Description>
              ) : null}
            </div>
            <Toast.Close className="rounded px-1 text-[12px] text-current/70 hover:bg-black/5">
              ×
            </Toast.Close>
          </div>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed bottom-4 right-4 z-[100] flex max-w-[100vw] flex-col gap-2 outline-none" />
    </Toast.Provider>
  );
}
