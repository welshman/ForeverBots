import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import QuickSimPage from "./pages/QuickSimPage";
import TopGearPage from "./pages/TopGearPage";
import DroptimizerPage from "./pages/DroptimizerPage";
import GearComparePage from "./pages/GearComparePage";
import AdvancedSimPage from "./pages/AdvancedSimPage";
import AboutPage from "./pages/AboutPage";
import { loadPreferences, savePreferences } from "./lib/storage";

const ROUTE_TITLES: Record<string, string> = {
  "/": "ForeverBots — World of Warcraft Forever Simulator",
  "/quick-sim": "Quick Sim — ForeverBots",
  "/top-gear": "Top Gear — ForeverBots",
  "/droptimizer": "Droptimizer — ForeverBots",
  "/gear-compare": "Gear Compare — ForeverBots",
  "/advanced-sim": "Advanced Sim — ForeverBots",
  "/about": "About — ForeverBots",
};

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => loadPreferences().theme);
  const location = useLocation();

  useEffect(() => {
    document.title = ROUTE_TITLES[location.pathname] ?? "ForeverBots";
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    const prefs = loadPreferences();
    savePreferences({ ...prefs, theme });
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-transparent dark:text-slate-100">
      <Navbar theme={theme} onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quick-sim" element={<QuickSimPage />} />
          <Route path="/top-gear" element={<TopGearPage />} />
          <Route path="/droptimizer" element={<DroptimizerPage />} />
          <Route path="/gear-compare" element={<GearComparePage />} />
          <Route path="/advanced-sim" element={<AdvancedSimPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 dark:border-gold-500/15 py-6 text-center text-xs text-slate-500 dark:text-slate-400 px-4">
        ForeverBots is an unofficial community project and is not affiliated with Blizzard Entertainment, the WoW Forever team, Raidbots, or MythicSim.
      </footer>
    </div>
  );
}
