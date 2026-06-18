// Check: check_tip_credit_legality  [code, deterministic]
//
// Some states ban the tip credit entirely (CA, OR, WA, MN, AK, MT). In those
// states the cash wage ITSELF must be at least the state minimum wage —
// regardless of how high tips are. Claiming a tip credit there underpays the
// cash wage and creates wage-and-hour liability. This is the counterintuitive
// one: a high-tip employee can still be underpaid.

import type { BatchRecord, RoleType, StateRule } from "../../types";
import { identity, type RawFinding } from "./_base";
import { round2, usd } from "../../util";

export function checkTipCreditLegality(
  record: BatchRecord,
  _role: RoleType,
  rules: StateRule,
): RawFinding | null {
  if (rules.tip_credit_allowed || !record.tip_credit_claimed) return null;

  const hours = round2(record.tipped_hours + record.nontipped_hours);
  const shortfallPerHour = round2(rules.min_wage - record.cash_wage_rate);
  if (shortfallPerHour <= 0) return null;

  const owed = round2(shortfallPerHour * hours);
  return {
    rule: "tip_credit_legality",
    ...identity(record),
    status: "clear",
    exact_owed: owed,
    explanation:
      `${record.state} does not allow a tip credit — cash wage must be at least ` +
      `${usd(rules.min_wage)}/h, no matter how high tips are. This employee was paid ` +
      `${usd(record.cash_wage_rate)}/h in cash for ${hours}h. Owe ${usd(owed)} in additional ` +
      `cash wages (tips of ${usd(record.tips_reported)} do not count toward this).`,
  };
}
