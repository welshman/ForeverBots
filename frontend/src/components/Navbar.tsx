import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, Sparkles, Github } from "lucide-react";

interface NavbarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

const NAV_ITEMS = [
  { to: "/quick-sim", label: "Quick Sim" },
  { to: "/top-gear", label: "Top Gear" },
  { to: "/droptimizer", label: "Droptimizer" },
  { to: "/gear-compare", label: "Gear Compare" },
  { to: "/advanced-sim", label: "Advanced Sim" },
  { to: "/about", label: "About" },
];

export default function Navbar({ theme, onToggleTheme }: NavbarProps) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-gold-500/20 bg-white/90 dark:bg-obsidian-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <Sparkles className="w-5 h-5 text-gold-400" aria-hidden="true" />
          <span className="bg-gradient-to-r from-gold-400 via-gold-300 to-arcane-400 bg-clip-text text-transparent">
            ForeverBots
          </span>
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
        </div>
      </div>
    </header>
  );
}
