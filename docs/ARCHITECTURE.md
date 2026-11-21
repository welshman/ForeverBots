# ForeverBots Architecture

ForeverBots is a static React + TypeScript + Vite web application paired with a Rust/WebAssembly adapter (`engine-adapter/rust`) wrapping `sage3648/mythicsim-forever-engine` (pinned to commit `375fd33d6c5745f9b4732dc4c6c72700d5c3fb2f`).

- **UI Thread**: Handles SimC parsing, validation, configuration, and report visualization.
- **Web Worker**: Loads the compiled `.wasm` module and executes `simulate_prepared_json` without blocking the UI.
- **Coverage Gate**: Preserved verbatim from `forever-engine`; unsupported mechanics are refused with their exact engine refusal codes.
