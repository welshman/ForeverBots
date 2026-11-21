# ForeverBots

Simulate. Optimize. Master WoW Forever.

## Status

Experimental foundation, NOT a completed application. No working website or verified WASM build is delivered by this commit. No simulation results are fabricated.

This repository targets World of Warcraft: Forever only, using https://github.com/sage3648/mythicsim-forever-engine as the simulation authority.

## Included

A draft wasm-bindgen adapter for the engine prepared-v2 API, preserving its gated simulation entry point and refusal payloads. It rejects inputs larger than 2 MiB and requests exceeding 10,000 iterations. These are adapter limits, not upstream engine limits.

## Not implemented or verified

- Complete upstream source, data, licensing, and WASM compatibility audit
- Successful native or WASM compilation and browser initialization
- SimC-to-engine character preparation
- Frontend, Worker queue, cancellation, timeouts, or memory cap
- Quick Sim, Top Gear, Droptimizer, Stat Weights, Gear Compare, Advanced Sim
- Asset loading, caching, reports, persistence, or sharing
- Native/WASM numerical parity, benchmarks, browser testing, or deployment

The upstream Git dependency follows main temporarily; pin an audited commit and commit Cargo.lock before reproducible release builds. Prepared input must match the engine identity. Do not bypass coverage refusals. A small dependency list alone does not establish WASM compatibility.

## Proposed build check

Requires Rust and wasm-pack. These commands have NOT been run here.

```sh
rustup target add wasm32-unknown-unknown
cd engine-adapter/rust
cargo check
wasm-pack build --target web --release --out-dir ../wasm
```

The adapter returns serialized engine reports; it does not infer missing DPS/HPS fields, synthesize statistics, or claim live iteration progress. It must only be invoked inside a dedicated Web Worker in a future frontend.

## Deployment

GitHub Pages deployment is not configured yet. Build verification, a working frontend, and native/WASM correctness tests are prerequisites to publishing a simulator.

## Attribution

MythicSim Forever Engine is an upstream project with its own license and notices. Review and preserve its LICENSE and NOTICE.md before distributing compiled artifacts. No Blizzard or Raidbots assets are included.

ForeverBots is an unofficial community project and is not affiliated with Blizzard Entertainment, the WoW Forever team, Raidbots, or MythicSim.
