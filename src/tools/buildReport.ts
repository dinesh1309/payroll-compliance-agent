// Tool: build_report  [code for structure, summary already provided]
// Assemble findings into a Review: totals, per-property rollups, verdict, notes.

import type { Batch, Finding, PropertyRollup, Review, Verdict } from "../types";
import { round2, usd } from "../util";
import { stateIsSeeded } from "./stateRules";

export function buildReport(batch: Batch, findings: Finding[], summary: string): Review {
  const clearViolations = findings.filter((f) => f.status === "clear" && f.exact_owed > 0);
  const needsHuman = findings.filter((f) => f.status === "needs_human");

  const verdict: Verdict =
    clearViolations.length > 0 ? "BLOCK" : needsHuman.length > 0 ? "REVIEW" : "CLEAR";

  // Per-property rollups.
  const byProperty = new Map<string, PropertyRollup>();
  for (const f of findings) {
    const cur =
      byProperty.get(f.property_id) ??
      {
        property_id: f.property_id,
        property_name: f.property_name,
        state: f.state,
        finding_count: 0,
        exact_owed: 0,
        potential_exposure: 0,
      };
    cur.finding_count += 1;
    cur.exact_owed = round2(cur.exact_owed + f.exact_owed);
    cur.potential_exposure = round2(cur.potential_exposure + f.potential_exposure);
    byProperty.set(f.property_id, cur);
  }

  // Clean records = records that produced no per-week finding.
  const flaggedWeeks = new Set(
    findings.filter((f) => f.workweek_start).map((f) => `${f.employee_id}|${f.workweek_start}`),
  );
  const cleanRecords = batch.records.filter(
    (r) => !flaggedWeeks.has(`${r.employee_id}|${r.workweek_start}`),
  ).length;

  const notes: string[] = [summary];

  // Per-week (no-averaging) insight: a violation week alongside a clean week.
  for (const f of findings) {
    if (f.rule !== "makeup_pay" || !f.workweek_start) continue;
    const otherWeeks = batch.records.filter(
      (r) =>
        r.employee_id === f.employee_id &&
        r.workweek_start !== f.workweek_start &&
        !flaggedWeeks.has(`${r.employee_id}|${r.workweek_start}`),
    );
    if (otherWeeks.length > 0) {
      notes.push(
        `${f.employee_name}: week of ${f.workweek_start} owes ${usd(f.exact_owed)} while the ` +
          `week of ${otherWeeks[0]!.workweek_start} clears — averaging the two would hide it. ` +
          `Makeup is owed per workweek.`,
      );
    }
  }

  // Warn if any state fell back to FEDERAL.
  const unseeded = [...new Set(batch.records.map((r) => r.state))].filter((s) => !stateIsSeeded(s));
  if (unseeded.length > 0) {
    notes.push(
      `State(s) ${unseeded.join(", ")} are not in the seeded rules table; used FEDERAL fallback. ` +
        `Seed them before relying on this in production.`,
    );
  }

  return {
    batch_id: batch.batch_id,
    group_name: batch.group_name,
    verdict,
    totals: {
      findings: findings.length,
      clear_violations: clearViolations.length,
      needs_human: needsHuman.length,
      clean_records: cleanRecords,
      exact_owed: round2(findings.reduce((s, f) => s + f.exact_owed, 0)),
      potential_exposure: round2(findings.reduce((s, f) => s + f.potential_exposure, 0)),
    },
    properties: [...byProperty.values()],
    findings,
    notes,
  };
}
