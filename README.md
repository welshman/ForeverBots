# ForeverBots

> **Simulate. Optimize. Master WoW Forever.**

ForeverBots is a client-side WebAssembly simulation web application for **World of Warcraft: Forever**, powered by the [MythicSim Forever Engine](https://github.com/sage3648/mythicsim-forever-engine) (pinned to commit `375fd33d6c5745f9b4732dc4c6c72700d5c3fb2f`). It compiles the Rust engine to WebAssembly, executes it in a dedicated Web Worker, and deploys directly to **GitHub Pages** with no required backend.

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
