// Check: check_notice_on_file  [code, deterministic]
//
// Before an employer may claim a tip credit, it must give the employee written
// notice (cash wage, credit claimed, that tips + cash must reach minimum wage).
// No notice on file = the tip credit is forfeited for that employee, so the
// full minimum wage is owed in cash for the period.

import type { BatchRecord, RoleType, StateRule } from "../../types";
import { identity, type RawFinding } from "./_base";
import { round2, usd } from "../../util";

export function checkNotice(
  record: BatchRecord,
  _role: RoleType,
  rules: StateRule,
): RawFinding | null {
  if (!record.tip_credit_claimed || !rules.tip_credit_allowed) {
    return null;
  }
  if (record.tip_credit_notice_on_file) return null;

  const hours = record.tipped_hours;
  const shortfallPerHour = round2(rules.min_wage - record.cash_wage_rate);
  const owed = round2(Math.max(0, shortfallPerHour) * hours);

  return {
    rule: "notice",
    ...identity(record),
    status: "clear",
    exact_owed: owed,
    explanation:
      `No written tip-credit notice is on file for this employee. Without it, the tip credit ` +
      `is forfeited and full minimum wage (${usd(rules.min_wage)}/h) is owed in cash for the ` +
      `${hours}h worked. Owe ${usd(owed)} for this week, and put a signed notice on file before next run.`,
  };
}
