// Tool: scan_anomalies  [model-led, with a deterministic floor]
//
// This is where the agent genuinely DECIDES something code can't enumerate:
// out-of-rule oddities a human should verify (implausible hours, impossible
// pay, copy-paste duplicates) that are NOT tip-credit / minimum-wage violations
// (those are handled deterministically elsewhere).
//
// The model leads (open-ended judgment). A small deterministic floor catches the
// obvious cases so the scan still works with no key. Either way the result is
// ADDITIVE and routed to a human — it can never subtract coverage or auto-act.

import type { Batch, Narrator } from "../types";
import type { RawFinding } from "./checks/_base";
import { usd } from "../util";

const IMPLAUSIBLE_HOURS = 80;

// Deterministic floor: the obvious, enumerable anomalies.
function floorScan(batch: Batch): Map<string, string> {
  const out = new Map<string, string>();
  // duplicate exact tip amounts across 3+ employees → likely a copy-paste error
  const byTip = new Map<number, string[]>();
  for (const r of batch.records) {
    const hrs = r.tipped_hours + r.nontipped_hours;
    if (hrs > IMPLAUSIBLE_HOURS) {
      out.set(r.employee_id, `${hrs}h in a single workweek is implausible — verify timekeeping.`);
    }
    if (r.cash_wage_rate <= 0) {
      out.set(r.employee_id, `Cash wage of ${usd(r.cash_wage_rate)}/h is invalid.`);
    }
    if (r.tips_reported < 0) {
      out.set(r.employee_id, `Negative tips reported (${usd(r.tips_reported)}).`);
    }
    if (r.tips_reported > 0) {
      const arr = byTip.get(r.tips_reported) ?? [];
      arr.push(r.employee_id);
      byTip.set(r.tips_reported, arr);
    }
  }
  for (const [, ids] of byTip) {
    if (ids.length >= 3) {
      for (const id of ids) {
        if (!out.has(id)) out.set(id, "Identical tip amount across several employees — possible data-entry error.");
      }
    }
  }
  return out;
}

// Model-led scan: the open-ended judgment.
async function modelScan(batch: Batch, narrator: Narrator): Promise<Map<string, string>> {
  const compact = batch.records.map((r) => ({
    id: r.employee_id,
    name: r.employee_name,
    title: r.job_title,
    state: r.state,
    tipped_hours: r.tipped_hours,
    nontipped_hours: r.nontipped_hours,
    cash_wage_rate: r.cash_wage_rate,
    tips: r.tips_reported,
  }));
  const text = await narrator({
    model: "sonnet",
    maxTokens: 500,
    system:
      "You are a payroll anomaly scanner. Flag ONLY records that are clearly IMPLAUSIBLE or " +
      "IMPOSSIBLE and a human must verify — never normal-looking records. A record is NOT an " +
      "anomaly just because pay is low or tips are modest (those are handled separately). " +
      "Flag ONLY: hours > 80 in one week; a wage <= 0 or absurdly high; identical values that " +
      "look copy-pasted; impossible/contradictory values. When in doubt, do NOT flag. " +
      'Return STRICT JSON: an array of {"employee_id","reason"}. If nothing is clearly wrong, return [].',
    prompt: JSON.stringify(compact),
  });
  const out = new Map<string, string>();
  if (!text) return out;
  try {
    const match = text.match(/\[[\s\S]*\]/);
    const arr = JSON.parse(match ? match[0] : text) as { employee_id: string; reason: string }[];
    for (const a of arr) {
      if (a && a.employee_id && a.reason) out.set(a.employee_id, a.reason);
    }
  } catch {
    // Unparseable model output → rely on the deterministic floor only.
  }
  return out;
}

export async function scanAnomalies(batch: Batch, narrator?: Narrator): Promise<RawFinding[]> {
  // Model reason wins for display; the floor fills any gaps.
  const reasons = narrator ? await modelScan(batch, narrator) : new Map<string, string>();
  for (const [id, reason] of floorScan(batch)) {
    if (!reasons.has(id)) reasons.set(id, reason);
  }

  const recById = new Map(batch.records.map((r) => [r.employee_id, r] as const));
  const findings: RawFinding[] = [];
  for (const [id, reason] of reasons) {
    const r = recById.get(id);
    if (!r) continue;
    findings.push({
      rule: "anomaly",
      employee_id: r.employee_id,
      employee_name: r.employee_name,
      property_id: r.property_id,
      property_name: r.property_name,
      state: r.state,
      workweek_start: null,
      status: "needs_human",
      exact_owed: 0,
      explanation: reason,
    });
  }
  return findings;
}
