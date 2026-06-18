// Shared types for the payroll compliance pre-flight agent.

// The LLM is injected as an optional "narrator" so the deterministic engine
// (and the browser bundle) never has to import the model SDK. Pass it on the
// server/CLI to enable language polish; omit it to run fully deterministically.
export type Narrator = (opts: {
  system: string;
  prompt: string;
  model?: "haiku" | "sonnet";
  maxTokens?: number;
}) => Promise<string | null>;

// A single visible action the agent took — surfaced in the live run feed so the
// user can watch which tool fired, on whom, and what it found.
export type PhaseId = "classify" | "rules" | "compute" | "anomalies" | "decide" | "gate";

export interface TraceEvent {
  phase: PhaseId;
  tool: string; // e.g. "check_makeup_pay"
  target?: string; // who/what it ran on
  detail: string; // the result, in plain words
  via: "model" | "code";
  flag?: boolean; // highlight (a violation)
}

export type RoleType = "tipped" | "non_tipped" | "manager";

export type RuleId =
  | "makeup_pay"
  | "tip_credit_legality"
  | "eighty_twenty"
  | "tip_pool"
  | "notice"
  | "anomaly"; // out-of-rule oddity flagged by the model, routed to a human

export type Verdict = "BLOCK" | "REVIEW" | "CLEAR";
export type FindingStatus = "clear" | "needs_human";
export type Severity = "high" | "medium" | "low";

// ---- Input: the operator's payroll batch (matches data/sample-batch.json) ----

export interface BatchRecord {
  employee_id: string;
  employee_name: string;
  property_id: string;
  property_name: string;
  state: string;
  job_title: string;
  role_type: RoleType | null; // null → classify_role fills it
  workweek_start: string;
  tipped_hours: number;
  nontipped_hours: number;
  longest_nontipped_block_min: number;
  cash_wage_rate: number;
  tips_reported: number;
  tip_credit_claimed: boolean;
  tip_pool_id: string | null;
  tip_credit_notice_on_file: boolean;
}

export interface PropertyRef {
  property_id: string;
  property_name: string;
  state: string;
}

export interface TipPool {
  tip_pool_id: string;
  property_id: string;
  member_employee_ids: string[];
}

export interface Batch {
  batch_id: string;
  group_name: string;
  pay_period_start: string;
  pay_period_end: string;
  run_date: string;
  prepared_by: string;
  properties: PropertyRef[];
  records: BatchRecord[];
  tip_pools: TipPool[];
}

// ---- State rules reference (data/state-rules.json) ----

export interface StateRule {
  min_wage: number;
  cash_floor: number;
  max_tip_credit: number;
  tip_credit_allowed: boolean;
}

// ---- Output: findings, corrections, review ----

export interface Correction {
  field: string; // what to change, e.g. "makeup_pay_adjustment"
  amount: number; // exact dollars to add (the deterministic fix)
  note: string; // human-readable instruction
}

export interface Finding {
  id: string;
  rule: RuleId;
  employee_id: string;
  employee_name: string;
  property_id: string;
  property_name: string;
  state: string;
  workweek_start: string | null;
  severity: Severity;
  status: FindingStatus; // clear violation vs needs a human to judge
  exact_owed: number; // deterministic, the hard number
  potential_exposure: number; // labeled estimate (e.g. FLSA liquidated damages)
  exposure_note: string;
  explanation: string; // plain-English (template, or LLM-written when enabled)
  correction: Correction | null;
}

export interface PropertyRollup {
  property_id: string;
  property_name: string;
  state: string;
  finding_count: number;
  exact_owed: number;
  potential_exposure: number;
}

export interface Review {
  batch_id: string;
  group_name: string;
  verdict: Verdict;
  totals: {
    findings: number;
    clear_violations: number;
    needs_human: number;
    clean_records: number;
    exact_owed: number;
    potential_exposure: number;
  };
  properties: PropertyRollup[];
  findings: Finding[];
  notes: string[];
}
