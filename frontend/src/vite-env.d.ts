/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SIMULATION_MODE?: "wasm" | "remote" | "auto";
  readonly VITE_REMOTE_ENGINE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
