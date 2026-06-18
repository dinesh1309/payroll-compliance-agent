// Tool: estimate_liability  [code, deterministic]
//
// Two numbers, never mixed:
//   exact_owed         — the back wages, computed exactly by the checks.
//   potential_exposure — a clearly-labeled ESTIMATE of additional risk if left
//                        uncorrected (FLSA allows liquidated damages up to an
//                        amount equal to the back wages).

import type { RawFinding } from "./checks/_base";

export function estimateLiability(rf: RawFinding): {
  potential_exposure: number;
  exposure_note: string;
} {
  if (rf.rule === "anomaly") {
    return {
      potential_exposure: 0,
      exposure_note: "Flagged for human review — not a quantified wage violation.",
    };
  }

  if (rf.rule === "tip_pool") {
    return {
      potential_exposure: 0,
      exposure_note:
        "Estimate: improperly distributed tips plus up to an equal amount in liquidated " +
        "damages. Needs the pool's distribution detail to quantify.",
    };
  }

  // Wage violations: liquidated damages can equal the back wages (≈ doubling).
  return {
    potential_exposure: rf.exact_owed,
    exposure_note:
      "Estimate: FLSA liquidated damages can add up to an equal amount if uncorrected " +
      "(roughly doubling the exposure). Correcting now avoids this.",
  };
}
