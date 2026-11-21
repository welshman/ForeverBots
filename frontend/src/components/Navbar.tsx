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
  { to: "/stat-weights", label: "Stat Weights" },
  { to: "/gear-compare", label: "Gear Compare" },
  { to: "/advanced-sim", label: "Advanced Sim" },
];

export default function Navbar({ theme, onToggleTheme }: NavbarProps) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Sparkles className="w-5 h-5 text-arcane-500" aria-hidden="true" />
          <span>ForeverBots</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-arcane-600 text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <Github className="w-5 h-5" />
          </a>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle color theme"
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
