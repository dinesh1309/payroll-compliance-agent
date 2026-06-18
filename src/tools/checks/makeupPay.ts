// Check: check_makeup_pay  [code, deterministic]
//
// Per workweek (no averaging): a tipped employee's cash wage + tips must reach
// the minimum wage for the hours worked. If short, the employer owes the gap.
// Only runs where tip credit is LEGALLY usable — if the state bans tip credit,
// tip_credit_legality owns that record instead.

import type { BatchRecord, RoleType, StateRule } from "../../types";
import { identity, type RawFinding } from "./_base";
import { round2, usd } from "../../util";

export function checkMakeupPay(
  record: BatchRecord,
  _role: RoleType,
  rules: StateRule,
): RawFinding | null {
  // Triggers on the employer's own tip-credit declaration, not on the role label
  // — so a role classification can never hide a wage violation.
  if (!record.tip_credit_claimed || !rules.tip_credit_allowed) {
    return null;
  }

  const hours = record.tipped_hours;
  const required = round2(rules.min_wage * hours);
  const actual = round2(record.cash_wage_rate * hours + record.tips_reported);
  if (actual >= required) return null;

  const owed = round2(required - actual);
  return {
    rule: "makeup_pay",
    ...identity(record),
    status: "clear",
    exact_owed: owed,
    explanation:
      `Tipped wage + tips fell below minimum wage this workweek. ` +
      `${hours}h require ${usd(required)} (min wage ${usd(rules.min_wage)}/h), but ` +
      `cash (${usd(record.cash_wage_rate)}/h) + ${usd(record.tips_reported)} tips = only ${usd(actual)}. ` +
      `Owe ${usd(owed)} in makeup pay. Makeup is owed PER WEEK — a high-tip week cannot offset this one.`,
  };
}
