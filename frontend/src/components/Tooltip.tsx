import type { ReactNode } from "react";

interface Props { label: string; children: ReactNode }

export default function Tooltip({ label, children }: Props) {
  return (
    <span className="relative inline-flex items-center group" title={label}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-obsidian-950 px-2 py-1 text-xs text-slate-200 shadow-lg group-hover:block group-focus-within:block">{label}</span>
    </span>
  );
}
