import { createPortal } from "react-dom";
import { useToast } from "../hooks/useToast";

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();
  return createPortal(
    <div aria-live="polite" className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(t => (
        <div key={t.id} role="status" className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm shadow-lg ${t.type === "error" ? "bg-rose-600" : t.type === "warning" ? "bg-amber-500 text-obsidian-950" : "bg-emerald-600"} text-white`}>
          <span>{t.message}</span>
          <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="ml-2 text-white/80 hover:text-white">×</button>
        </div>
      ))}
    </div>,
    document.body
  );
}
