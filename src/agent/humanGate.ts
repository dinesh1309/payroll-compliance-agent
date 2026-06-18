// Tool: request_approval  [human gate]
//
// The hard safety boundary. The agent NEVER submits payroll and NEVER applies a
// correction on its own. It surfaces the drafted corrections and stops, waiting
// for a payroll specialist to approve. In the CLI demo this is a stop point; in
// the UI it is an explicit approve/reject step.

import type { Review } from "../types";

export interface ApprovalResult {
  applied: false;
  pending: number;
  message: string;
}

export function requestApproval(review: Review): ApprovalResult {
  const pending = review.findings.filter((f) => f.correction).length;
  return {
    applied: false,
    pending,
    message:
      review.verdict === "CLEAR"
        ? "No corrections needed. A specialist can submit this run."
        : `${pending} correction(s) drafted and awaiting payroll-specialist approval. ` +
          `Nothing has been changed or submitted — the agent stops here by design.`,
  };
}
