// Check: check_80_20  [code, deterministic]
//
// A tipped employee can do incidental non-tipped work, but a continuous block
// of more than 30 minutes of non-tipped duties must be paid at full minimum
// wage, not the tipped cash wage. Only relevant where tip credit is used.

import type { BatchRecord, RoleType, StateRule } from "../../types";
import { identity, type RawFinding } from "./_base";
import { round2, usd } from "../../util";

const BLOCK_LIMIT_MIN = 30;

export function checkEighty20(
  record: BatchRecord,
  _role: RoleType,
  rules: StateRule,
): RawFinding | null {
  if (!record.tip_credit_claimed || !rules.tip_credit_allowed) {
    return null;
  }
  if (record.longest_nontipped_block_min <= BLOCK_LIMIT_MIN) return null;

  const hours = record.nontipped_hours;
  const shortfallPerHour = round2(rules.min_wage - record.cash_wage_rate);
  const owed = round2(Math.max(0, shortfallPerHour) * hours);

  return {
    rule: "eighty_twenty",
    ...identity(record),
    status: "clear",
    exact_owed: owed,
    explanation:
      `Worked a ${record.longest_nontipped_block_min}-minute continuous block of non-tipped ` +
      `duties (over the 30-minute limit) while paid the tipped cash wage. That ${hours}h of ` +
      `non-tipped work must be paid at full minimum wage (${usd(rules.min_wage)}/h). ` +
      `Owe ${usd(owed)} for the difference.`,
  };
}
