// The agent — deterministic orchestration that guarantees every record is
// checked, calling the LLM (the injected narrator) only for the fuzzy sub-steps.
// As it runs it emits TraceEvents so the UI can show, live, which tool fired on
// whom and what it found — the 5 steps and their sub-steps.

import type { Batch, Finding, Narrator, Review, RoleType, RuleId, TraceEvent } from "../types";
import type { RawFinding } from "../tools/checks/_base";

import { getStateRules } from "../tools/stateRules";
import { classifyRole } from "../tools/classifyRole";
import { checkTipCreditLegality } from "../tools/checks/tipCreditLegality";
import { checkMakeupPay } from "../tools/checks/makeupPay";
import { checkNotice } from "../tools/checks/notice";
import { checkEighty20 } from "../tools/checks/eighty20";
import { checkTipPool } from "../tools/checks/tipPool";
import { scanAnomalies } from "../tools/scanAnomalies";
import { estimateLiability } from "../tools/estimateLiability";
import { draftCorrection } from "../tools/draftCorrection";
import { triage } from "./triage";
import { buildReport } from "../tools/buildReport";
import { usd } from "../util";

export { PHASE_LABELS, PHASE_ORDER } from "./phases";

const PER_RECORD_CHECKS = [checkTipCreditLegality, checkMakeupPay, checkNotice, checkEighty20];

const CHECK_TOOL: Record<RuleId, string> = {
  makeup_pay: "check_makeup_pay",
  tip_credit_legality: "check_tip_credit_legality",
  eighty_twenty: "check_80_20",
  notice: "check_notice_on_file",
  tip_pool: "check_tip_pool",
  anomaly: "scan_anomalies",
};
const RULE_SHORT: Record<RuleId, string> = {
  makeup_pay: "makeup pay",
  tip_credit_legality: "illegal tip credit",
  eighty_twenty: "80/20 breach",
  notice: "missing notice",
  tip_pool: "illegal pool",
  anomaly: "anomaly",
};

export interface RunOptions {
  narrator?: Narrator;
  onEvent?: (e: TraceEvent) => void;
}

export async function reviewBatch(batch: Batch, opts: RunOptions = {}): Promise<Review> {
  const { narrator, onEvent } = opts;
  const emit = (e: TraceEvent) => onEvent?.(e);
  const via: "model" | "code" = narrator ? "model" : "code";

  // 1. Classify each employee's role once.
  const roleByEmployee = new Map<string, RoleType>();
  for (const r of batch.records) {
    if (roleByEmployee.has(r.employee_id)) continue;
    const role = classifyRole(r); // deterministic — same answer every run
    roleByEmployee.set(r.employee_id, role);
    emit({
      phase: "classify",
      tool: "classify_role",
      target: `${r.employee_name} · ${r.job_title}`,
      detail: `→ ${role}`,
      via: "code",
    });
  }

  // 2. Load the ruleset for each state in play.
  const seenState = new Set<string>();
  for (const r of batch.records) {
    const st = r.state.toUpperCase();
    if (seenState.has(st)) continue;
    seenState.add(st);
    const rules = getStateRules(st);
    emit({
      phase: "rules",
      tool: "get_state_rules",
      target: st,
      detail: rules.tip_credit_allowed
        ? `tip credit allowed · min ${usd(rules.min_wage)}`
        : `tip credit BANNED · min ${usd(rules.min_wage)}`,
      via: "code",
      flag: !rules.tip_credit_allowed,
    });
  }

  // 3. Run every record through every applicable check.
  const raw: RawFinding[] = [];
  for (const r of batch.records) {
    const role = roleByEmployee.get(r.employee_id)!;
    const rules = getStateRules(r.state);
    const before = raw.length;
    for (const check of PER_RECORD_CHECKS) {
      const f = check(r, role, rules);
      if (f) raw.push(f);
    }
    const got = raw.slice(before);
    const who = `${r.employee_name} · wk ${r.workweek_start.slice(5)}`;
    if (got.length === 0) {
      emit({ phase: "compute", tool: "checks", target: who, detail: "clear", via: "code" });
    } else {
      for (const f of got) {
        emit({
          phase: "compute",
          tool: CHECK_TOOL[f.rule],
          target: who,
          detail: `${RULE_SHORT[f.rule]} · ${usd(f.exact_owed)}`,
          via: "code",
          flag: true,
        });
      }
    }
  }
  for (const f of checkTipPool(batch, roleByEmployee)) {
    raw.push(f);
    emit({
      phase: "compute",
      tool: "check_tip_pool",
      target: f.employee_name,
      detail: "illegal tip-pool member",
      via: "code",
      flag: true,
    });
  }

  // 3b. Open-ended layer: the model scans for out-of-rule anomalies (the genuine
  // judgment call). Additive only — flagged items route to a human, never auto-acted.
  const anomalies = await scanAnomalies(batch, narrator);
  if (anomalies.length === 0) {
    emit({
      phase: "anomalies",
      tool: "scan_anomalies",
      detail: "no out-of-rule anomalies",
      via,
    });
  } else {
    for (const f of anomalies) {
      raw.push(f);
      emit({
        phase: "anomalies",
        tool: "scan_anomalies",
        target: f.employee_name,
        detail: f.explanation,
        via,
        flag: true,
      });
    }
  }

  // 4. Attach exposure + drafted correction, then triage.
  const findings: Finding[] = await Promise.all(
    raw.map(async (rf, i): Promise<Finding> => {
      const { potential_exposure, exposure_note } = estimateLiability(rf);
      const correction = await draftCorrection(rf, narrator);
      return {
        ...rf,
        id: `${rf.rule}-${i + 1}`,
        severity: "low",
        potential_exposure,
        exposure_note,
        correction,
      };
    }),
  );
  const { findings: ranked, summary } = await triage(findings, narrator);
  emit({
    phase: "decide",
    tool: "triage",
    detail: `ranked ${ranked.length} finding${ranked.length === 1 ? "" : "s"} by dollars at risk`,
    via,
  });
  for (const f of ranked) {
    if (!f.correction) continue;
    emit({
      phase: "decide",
      tool: "draft_correction",
      target: f.employee_name,
      detail: f.exact_owed > 0 ? `fix ${usd(f.exact_owed)}` : "route to human",
      via,
    });
  }

  const review = buildReport(batch, ranked, summary);

  // 5. Human gate.
  emit({
    phase: "gate",
    tool: "request_approval",
    detail:
      review.verdict === "CLEAR"
        ? "clean — a specialist may submit"
        : `${ranked.filter((f) => f.correction).length} corrections drafted; agent stops`,
    via: "code",
  });

  return review;
}
