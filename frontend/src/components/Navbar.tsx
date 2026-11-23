import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, Sparkles, Github, Menu, X } from "lucide-react";

interface NavbarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

const NAV_ITEMS = [
  { to: "/sim", label: "Sim" },
  { to: "/droptimizer", label: "Droptimizer" },
  { to: "/about", label: "About" },
];

export default function Navbar({ theme, onToggleTheme }: NavbarProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-gold-500/20 bg-white/90 dark:bg-obsidian-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 font-bold text-lg tracking-tight"
        >
          <Sparkles className="w-5 h-5 text-gold-400" aria-hidden="true" />
          <span className="text-gold-400">ForeverBots</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-gold-500/15 text-gold-400 border border-gold-500/40"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/welshman/ForeverBots"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300"
          >
            <Github className="w-5 h-5" />
          </a>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle color theme"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-gold-400" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile"
          className="md:hidden border-t border-slate-200 dark:border-gold-500/15 bg-white/95 dark:bg-obsidian-950/95 px-4 py-3 space-y-1"
        >
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-gold-500/15 text-gold-400 border border-gold-500/40"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
