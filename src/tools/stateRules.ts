// Tool: get_state_rules  [code, deterministic]
// Look up the wage/tip ruleset for a state, falling back to FEDERAL.
// JSON is imported (not read from disk) so this runs in the browser too.

import rulesJson from "../../data/state-rules.json";
import type { StateRule } from "../types";

const RULES = rulesJson as Record<string, StateRule>;

export function getStateRules(state: string): StateRule {
  const key = state.toUpperCase();
  return RULES[key] ?? RULES["FEDERAL"]!;
}

export function stateIsSeeded(state: string): boolean {
  return state.toUpperCase() in RULES;
}

export function seededStates(): string[] {
  return Object.keys(RULES).filter((s) => s !== "FEDERAL");
}
