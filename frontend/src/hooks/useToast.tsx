import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export interface Toast { id: string; message: string; type: "success" | "error" | "warning" }
interface ToastContextValue { toasts: Toast[]; show: (message: string, type?: Toast["type"]) => void; dismiss: (id: string) => void }

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: string) => setToasts(t => t.filter(x => x.id !== id)), []);
  const show = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = crypto.randomUUID();
    setToasts(t => [...t, { id, message, type }]);
    window.setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);
  return <ToastContext.Provider value={{ toasts, show, dismiss }}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
