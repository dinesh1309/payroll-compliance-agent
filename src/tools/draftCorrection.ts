// Tool: draft_correction  [hybrid]
//
// Code computes the exact fix (field + amount). The injected narrator (LLM),
// when provided, phrases the instruction for a payroll admin; otherwise a
// deterministic template is used. The amount is ALWAYS the code's exact number.

import type { Correction, Narrator } from "../types";
import type { RawFinding } from "./checks/_base";
import { usd } from "../util";

function templateNote(rf: RawFinding): { field: string; note: string } {
  const week = rf.workweek_start ? ` (week of ${rf.workweek_start})` : "";
  switch (rf.rule) {
    case "makeup_pay":
      return {
        field: "add_makeup_pay",
        note: `Add ${usd(rf.exact_owed)} makeup pay to ${rf.employee_name}${week} before submitting.`,
      };
    case "tip_credit_legality":
      return {
        field: "raise_cash_wage_and_backpay",
        note: `Pay ${usd(rf.exact_owed)} additional cash wages to ${rf.employee_name}; ${rf.state} bans the tip credit, so raise the cash wage to the state minimum going forward.`,
      };
    case "eighty_twenty":
      return {
        field: "reclassify_nontipped_hours",
        note: `Pay ${usd(rf.exact_owed)} to ${rf.employee_name} for the non-tipped block at full minimum wage${week}.`,
      };
    case "notice":
      return {
        field: "additional_cash_wages",
        note: `Pay ${usd(rf.exact_owed)} to ${rf.employee_name}${week} and put a signed tip-credit notice on file before the next run.`,
      };
    case "tip_pool":
      return {
        field: "restructure_tip_pool",
        note: `Remove ${rf.employee_name} from the tip pool; have a human quantify the reclaim amount.`,
      };
    case "anomaly":
      return {
        field: "flag_for_review",
        note: `Route ${rf.employee_name} to a human to verify the flagged anomaly.`,
      };
  }
}

export async function draftCorrection(rf: RawFinding, narrator?: Narrator): Promise<Correction> {
  const { field, note } = templateNote(rf);

  const polished = narrator
    ? await narrator({
        model: "haiku",
        maxTokens: 80,
        system:
          "Rewrite the payroll correction instruction as one crisp imperative sentence for a " +
          "payroll admin. Keep every dollar amount and name EXACTLY as given. No preamble.",
        prompt: note,
      })
    : null;

  const cents = usd(rf.exact_owed).replace("$", "");
  return {
    field,
    amount: rf.exact_owed,
    note: polished && polished.includes(cents) ? polished : note,
  };
}
