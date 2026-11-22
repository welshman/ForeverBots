export type SimulationPhase =
  | "parsing"
  | "loading-assets"
  | "preparing"
  | "checking"
  | "simulating"
  | "complete"
  | "failed"
  | "cancelled";

export interface GearItem {
  slot: string;
  name?: string;
  itemId?: number;
  enchantId?: number;
  gemIds?: number[];
  raw: string;
  line: number;
}

export interface ParseIssue {
  line: number;
  severity: "error" | "warning";
  message: string;
}

export interface CharacterSheetData {
  base: [number, number, number, number, number];
  attributes: [number, number, number, number, number];
  health: number;
  mana: number;
  meleeCrit: number;
  spellCrit: number;
}

export interface ParsedSimcProfile {
  characterName: string;
  className: string;
  spec: string;
  level: number;
  race: string;
  realm?: string;
  region?: string;
  talents?: string;
  glyphs?: string;
  professions?: string;
  gear: GearItem[];
  characterSheet?: CharacterSheetData;
  rawText: string;
  status: "supported" | "partially-unsupported" | "unparseable";
  issues: ParseIssue[];
}

export interface SimulationOptions {
  fightStyle: "Patchwerk";
  durationSeconds: number;
  durationVariancePct: number;
  targetCount: number;
  iterations: number;
  latencyMs: number;
  seed: number;
  preparedJsonOverride?: string;
}

export interface SimulationRequest {
  jobId: string;
  profile: ParsedSimcProfile;
  options: SimulationOptions;
  presetId?: string;
}

export interface SimulationProgress {
  jobId: string;
  phase: SimulationPhase;
  progress: number;
  iterationsCompleted?: number;
  totalIterations?: number;
  message?: string;
}

export interface EngineWarning {
  code: string;
  message: string;
}

export interface EngineError {
  code: string;
  message: string;
}

export interface SimulationStatistics {
  mean: number;
  min?: number;
  max?: number;
  median?: number;
  stdDev?: number;
}

export interface SimulationResult {
  jobId: string;
  ok: boolean;
  dps?: number;
  hps?: number;
  statistics: SimulationStatistics;
  warnings: EngineWarning[];
  errors: EngineError[];
  rawInput: string;
  rawOutput: string;
  engineVersion: string;
  durationMs: number;
}
