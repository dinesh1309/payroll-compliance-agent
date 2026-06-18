import type { PhaseId } from "../types";

// Shared phase metadata — no engine imports, so the client can use it without
// pulling the whole orchestrator into the browser bundle.
export const PHASE_ORDER: PhaseId[] = [
  "classify",
  "rules",
  "compute",
  "anomalies",
  "decide",
  "gate",
];

export const PHASE_LABELS: Record<PhaseId, string> = {
  classify: "Classify roles",
  rules: "Apply state rules",
  compute: "Run compliance checks",
  anomalies: "Scan for anomalies",
  decide: "Triage & draft fixes",
  gate: "Human gate",
};
