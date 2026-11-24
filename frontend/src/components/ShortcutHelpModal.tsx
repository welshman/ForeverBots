import { useEffect } from "react";

const SHORTCUTS = [
  { keys: "Ctrl/Cmd + Enter", desc: "Run simulation" },
  { keys: "Escape", desc: "Cancel running simulation / close modal" },
  { keys: "?", desc: "Show this help" },
];

export default function ShortcutHelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-obsidian-900 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gold-400">Keyboard Shortcuts</h2>
        <ul className="space-y-2 text-sm">
          {SHORTCUTS.map(s => (
            <li key={s.keys} className="flex justify-between gap-4">
              <kbd className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-gold-400">{s.keys}</kbd>
              <span className="text-slate-300">{s.desc}</span>
            </li>
          ))}
        </ul>
        <button type="button" onClick={onClose} className="w-full rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-obsidian-950 hover:bg-gold-400">Close</button>
      </div>
    </div>
  );
}
