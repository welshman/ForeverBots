import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import QuickSimPage from "./pages/QuickSimPage";
import TopGearPage from "./pages/TopGearPage";
import DroptimizerPage from "./pages/DroptimizerPage";
import StatWeightsPage from "./pages/StatWeightsPage";
import GearComparePage from "./pages/GearComparePage";
import AdvancedSimPage from "./pages/AdvancedSimPage";
import { loadPreferences, savePreferences } from "./lib/storage";

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => loadPreferences().theme);

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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar theme={theme} onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quick-sim" element={<QuickSimPage />} />
          <Route path="/top-gear" element={<TopGearPage />} />
          <Route path="/droptimizer" element={<DroptimizerPage />} />
          <Route path="/stat-weights" element={<StatWeightsPage />} />
          <Route path="/gear-compare" element={<GearComparePage />} />
          <Route path="/advanced-sim" element={<AdvancedSimPage />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 px-4">
        ForeverBots is an unofficial community project and is not affiliated with Blizzard Entertainment, the WoW Forever team, Raidbots, or MythicSim.
      </footer>
    </div>
  );
}
