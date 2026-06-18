// Tool: classify_role  [deterministic code — NOT the model]
//
// Roles are classified by a keyword lookup with a safe fallback. We deliberately
// do NOT use the LLM here: role classification would gate which checks apply, and
// a non-deterministic label (the model flip-flopping on an ambiguous title like
// "Floor Captain") would change the compliance result run-to-run. A compliance
// tool must be deterministic. The model's judgment lives in scan_anomalies, where
// it is additive and routes to a human — it can never silently alter the math.
//
// Note: the wage checks no longer depend on this label at all (they trigger on
// `tip_credit_claimed`). Role only affects tip-pool legality.

import type { BatchRecord, RoleType } from "../types";

const MANAGER = ["manager", "supervisor", "gm", "general manager", "director", "owner"];
const TIPPED = [
  "server", "waiter", "waitress", "bartender", "barback", "busser",
  "host", "hostess", "runner", "valet", "bellhop", "concierge",
];
const NON_TIPPED = [
  "cook", "chef", "dishwasher", "kitchen", "prep", "front desk", "desk agent",
  "housekeep", "maintenance", "janitor", "clerk", "accountant", "admin",
];

function lookup(title: string): RoleType | null {
  const t = title.toLowerCase();
  if (MANAGER.some((k) => t.includes(k))) return "manager";
  if (TIPPED.some((k) => t.includes(k))) return "tipped";
  if (NON_TIPPED.some((k) => t.includes(k))) return "non_tipped";
  return null;
}

export function classifyRole(record: BatchRecord): RoleType {
  if (record.role_type) return record.role_type; // explicit value wins
  const hit = lookup(record.job_title);
  if (hit) return hit;
  // Unknown title → deterministic fallback from the data. Safe because wage
  // checks key off tip_credit_claimed, not this label.
  return record.tipped_hours > 0 ? "tipped" : "non_tipped";
}
