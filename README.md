# ForeverBots

> **Simulate. Optimize. Master WoW Forever.**

ForeverBots is a free, client-side WebAssembly combat simulator for **World of Warcraft: Forever**, powered by the [MythicSim Forever Engine](https://github.com/sage3648/mythicsim-forever-engine) (pinned to commit `375fd33d6c5745f9b4732dc4c6c72700d5c3fb2f`). It compiles the Rust engine to WebAssembly, runs simulations inside a dedicated browser Web Worker, and deploys directly to **GitHub Pages** with no backend or account required.

## Required In-Game Addon

ForeverBots imports character profiles from the **SimulationCraft Addon**:

1. Install the **SimulationCraft Addon** in-game.
2. Type `/simc` and copy the generated text.
3. Paste the output into the importer or upload a `.simc` / `.txt` file.

Your last `/simc` profile is automatically remembered in `localStorage` (with a one-click **Clear** button). For characters below Level 60, the importer displays **Character Sheet Calibration** fields (Health, Mana, Melee Crit %, Spell Crit %, and base attributes) so the engine can calibrate your level.

## Features & Tools

- **Quick Sim (`/quick-sim`)** — Run Patchwerk single-target simulations with configurable fight length and iterations, one-click preset pills (`60s`/`180s`/`300s`, `500`/`1000`/`5000`), `Ctrl/Cmd+Enter` shortcut, and a live progress bar. Includes:
  - **Pre-Flight Profile Validation** — Detects missing class/spec, empty gear, unparseable profiles, or missing Level <60 calibration before running.
  - **Saved Profiles Library** — Save named `/simc` profiles in `localStorage`, and load, duplicate, or delete them with one click.
  - **Result Insights & 95% Confidence Interval** — Calculates a 95% confidence interval around mean DPS, stability badge (Stable / Moderate variance / High variance), and variance warnings.
  - **Noise-Aware Run Comparison** — Select any previous run in Recent Simulations as a baseline to see DPS delta, percentage change, and a clear verdict (Clear upgrade / Clear downgrade / Within simulation noise).
  - **Markdown & CSV Exports** — Copy a formatted Markdown summary table for Discord or download a CSV report, alongside **Copy Raw Input** and **Copy Raw Engine Output**.
  - **Sortable Damage Breakdown**, **Buff & Debuff Uptime** with filter tabs, **Sample Ability Log**, **More Options** (Duration Variance, Latency, RNG Seed), and **Escape-to-cancel**.
- **Top Gear (`/top-gear`)** — Evaluate gear combinations with lock constraints, pruning, and statistical uncertainty.
- **Droptimizer (`/droptimizer`)** — Rank candidate item upgrades using verified engine item data.
- **Gear Compare (`/gear-compare`)** — Compare two profiles side-by-side with plain-language statistical verdicts.
- **Advanced Sim (`/advanced-sim`)** — Run validated `prepared_v2` JSON directly through the Rust/WASM coverage gate and engine.
- **About (`/about`)** — Overview of how ForeverBots works, required addon info, FAQ, and current engine limitations.
- **FAQ** — Six-question FAQ on both the homepage and About page covering how the simulator works, required addon, profile statuses, result differences, and data privacy.
- **WoW Forever Theme & Responsive UI** — Unified obsidian and gold styling, dark/light mode toggle, dynamic page titles, scroll-to-top navigation, keyboard focus rings, and a responsive mobile menu.

## Current Limitations

- Simulations currently focus on **Patchwerk single-target** encounters.
- Characters **below Level 60** require manual Character Sheet calibration fields in the importer.
- Coverage-gated engine rules intentionally refuse unsupported specs, items, or mechanics rather than returning misleading numbers.
- Some less common spell IDs in reports may still appear as `Spell #ID` until added to the spell-name map.

## Local Development

```sh
rustup toolchain install 1.99.1 --profile minimal
rustup target add wasm32-unknown-unknown --toolchain 1.99.1
cargo install wasm-pack --version 0.13.1 --locked

cd engine-adapter/rust
RUSTFLAGS="-C link-arg=--max-memory=268435456" wasm-pack build --target web --release --out-dir ../../frontend/src/wasm

cd ../../frontend
npm install
npm run typecheck
npm test -- --run
npm run dev
```

## GitHub Pages Deployment

1. Go to **Settings → Pages** in `welshman/ForeverBots`.
2. Set **Source** to **GitHub Actions**.
3. Wait for **Build and Deploy to GitHub Pages** to complete.
4. Open `https://welshman.github.io/ForeverBots/`.

## Disclaimer

ForeverBots is an unofficial community project and is not affiliated with Blizzard Entertainment, the WoW Forever team, Raidbots, or MythicSim.
