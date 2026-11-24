import type { SimulationOptions } from "../types/simulation";

export function encodeOptionsToUrl(options: SimulationOptions): string {
  const params = new URLSearchParams();
  params.set("duration", String(options.durationSeconds));
  params.set("iterations", String(options.iterations));
  params.set("variance", String(options.durationVariancePct));
  params.set("latency", String(options.latencyMs));
  params.set("seed", String(options.seed));
  return params.toString();
}

export function decodeOptionsFromUrl(search: string): Partial<SimulationOptions> | null {
  const params = new URLSearchParams(search);
  const duration = params.get("duration");
  const iterations = params.get("iterations");
  if (!duration && !iterations) return null;
  const out: Partial<SimulationOptions> = {};
  if (duration) out.durationSeconds = Number(duration);
  if (iterations) out.iterations = Number(iterations);
  const variance = params.get("variance");
  const latency = params.get("latency");
  const seed = params.get("seed");
  if (variance) out.durationVariancePct = Number(variance);
  if (latency) out.latencyMs = Number(latency);
  if (seed) out.seed = Number(seed);
  return out;
}

export function buildShareUrl(options: SimulationOptions): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?${encodeOptionsToUrl(options)}`;
}
