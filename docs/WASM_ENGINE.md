# WASM integration: partial audit and verification plan

## Exact source

Engine repository: sage3648/mythicsim-forever-engine

Pinned Rust source commit: 375fd33d6c5745f9b4732dc4c6c72700d5c3fb2f

This is distinct from the engine's Go reference revision. release/manifest.json records package 0.1.0, experimental status, client build 1.60.1.70425, and Go reference a667dce8492bd9fb94269a9f864289cb74006775. Keep both revisions in report provenance.

## Inspected behavior

- src/data.rs embeds JSONL tables using include_str!, indexes keys with OnceLock on first access, and caches decoded rows in thread-local storage. Thread-local storage is not proof of spawned simulation threads. This inspected loader needs no desktop runtime filesystem.
- src/prepare.rs exports prepare_json and prepare_json_with; prepare_json explicitly selects Rules::Forever. It accepts application request JSON, NOT raw SimC text. SimC field mapping and its precise contract still require audit. Preparation failures must never fall back to another game's rules.
- src/core/rng.rs uses deterministic SplitMix64 and optional labeled streams. Iterations reseed with seed plus iteration index. Do not replace this RNG.
- src/core/stopwatch.rs already handles wasm32-unknown-unknown: engine elapsed_ns is zero there. A future Worker must measure duration with performance.now without modifying raw engine output.
- src/engine/coverage.rs defines serialized code/reason refusals and gates for nine classes. This does not certify every spec, item, rotation, or encounter, nor browser support. The file response was truncated: it has NOT been fully reviewed.
- Upstream rust-toolchain.toml pins Rust 1.99.1; this project now matches it.

## Corrections to the initial plan

The engine is not restricted to the historical Frostbolt kernel merely because an older library comment says so. Coverage and capabilities must be evaluated against the pinned implementation. Likewise, data is currently embedded, not fetched asynchronously from data/ at runtime. Do not duplicate those tables as downloadable assets before measuring the compiled module and auditing extraction boundaries.

## What this CI does

The engine-verification workflow checks adapter formatting and lint, runs native adapter and pinned upstream tests, builds web and Node-target WASM, exercises actual Node WASM initialization and input rejection, and records raw/gzip binary sizes and SHA-256. These checks are configured, not claimed successful until their Actions run is inspected. There are no adapter Rust unit tests yet; cargo test alone must not be reported as fixture coverage.

A 256 MiB WASM linear-memory maximum is requested at link time. It is not a cap on total browser memory, JS allocations, report size, or CPU time. Validate the emitted module and test allocation failures before calling memory handling verified. No Worker timeout or cancellation exists yet.

The adapter lockfile is generated and uploaded with artifacts. Transitive dependencies are NOT yet reproducibly pinned across runs; review and commit that lockfile in a subsequent change. wasm-pack is version-pinned, but GitHub Actions use major tags pending a full action-SHA security review. No Pages deployment or remote services are configured.

## Remaining release gates

1. Inspect all modules, contracts, CLI exit behavior, build scripts, presets, fixtures, tests, docs, tools, upstream notices, and runtime assumptions; the audit above is partial.
2. Inspect CI results and fix all compilation, lint, or runtime failures.
3. Add prepared-input fixtures, coverage-refusal regression tests, and native/WASM numerical parity tests, excluding only documented wall-clock metadata from comparison.
4. Run real simulations in browser Workers in Firefox and Chromium, then WebKit where feasible. Node smoke tests are not browser tests.
5. Measure initialization, simulation throughput, peak memory, and report sizes before selecting iteration limits and asset splitting.
6. Add a Worker host with queue, hard termination on cancellation/timeout, truthful indeterminate progress where iteration callbacks are unavailable, and structured diagnostics.
7. Implement strict SimC mapping into the audited Forever request schema and complete UI tools only where supported.

No final WASM size, benchmark, browser support matrix, or correctness result is available yet.
