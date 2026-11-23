import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import QuickSimPage from "./pages/QuickSimPage";
import DroptimizerPage from "./pages/DroptimizerPage";
import AboutPage from "./pages/AboutPage";
import { loadPreferences, savePreferences } from "./lib/storage";

const ROUTE_TITLES: Record<string, string> = {
  "/": "ForeverBots — World of Warcraft Forever Simulator",
  "/sim": "Sim — ForeverBots",
  "/droptimizer": "Droptimizer — ForeverBots",
  "/about": "About — ForeverBots",
};

function LegacySimRedirect({ advanced = false }: { advanced?: boolean }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  if (advanced) params.set("advanced", "1");
  const query = params.toString();
  return <Navigate to={{ pathname: "/sim", search: query ? `?${query}` : "", hash: location.hash }} replace />;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="max-w-xl mx-auto rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 space-y-3 text-center">
          <h1 className="text-lg font-bold text-rose-400">Something went wrong</h1>
          <p className="text-xs font-mono text-slate-300">{this.state.error.message}</p>
          <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-gold-500 text-obsidian-950 text-xs font-semibold hover:bg-gold-400 transition-colors">Reload ForeverBots</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => loadPreferences().theme);
  const [showTop, setShowTop] = useState(false);
  const location = useLocation();
  useEffect(() => {
    document.title = ROUTE_TITLES[location.pathname] ?? "ForeverBots";
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    const prefs = loadPreferences();
    savePreferences({ ...prefs, theme });
  }, [theme]);
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-transparent dark:text-slate-100">
      <Navbar theme={theme} onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/sim" element={<QuickSimPage />} />
            <Route path="/quick-sim" element={<LegacySimRedirect />} />
            <Route path="/droptimizer" element={<DroptimizerPage />} />
            <Route path="/advanced-sim" element={<LegacySimRedirect advanced />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </ErrorBoundary>
      </main>
      {showTop && <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Scroll to top" className="fixed bottom-6 right-6 z-30 px-3 py-2 rounded-full border border-gold-500/40 bg-obsidian-900/90 text-gold-400 text-xs font-semibold shadow-lg hover:bg-gold-500/20 transition-colors">↑ Top</button>}
      <footer className="border-t border-slate-200 dark:border-gold-500/15 py-6 text-center text-xs text-slate-500 dark:text-slate-400 px-4">
        ForeverBots is an unofficial community project and is not affiliated with Blizzard Entertainment, the WoW Forever team, Raidbots, or MythicSim.
      </footer>
    </div>
  );
}
