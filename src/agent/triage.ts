// Tool: triage  [hybrid]
//
// Ranking and severity are DETERMINISTIC (a compliance tool must order risk
// predictably). The injected narrator (LLM), when provided, only writes the
// one-line human summary; a template is used otherwise.

import type { Finding, Narrator } from "../types";
import { round2, usd } from "../util";

export async function triage(
  findings: Finding[],
  narrator?: Narrator,
): Promise<{ findings: Finding[]; summary: string }> {
  for (const f of findings) {
    if (f.status === "needs_human") f.severity = "medium";
    else if (f.exact_owed >= 100) f.severity = "high";
    else if (f.exact_owed > 0) f.severity = "medium";
    else f.severity = "low";
  }

  const ranked = [...findings].sort((a, b) => {
    if (a.status !== b.status) return a.status === "clear" ? -1 : 1;
    return b.exact_owed - a.exact_owed;
  });

  const clear = ranked.filter((f) => f.status === "clear");
  const human = ranked.filter((f) => f.status === "needs_human");
  const owed = round2(clear.reduce((s, f) => s + f.exact_owed, 0));

  const fallback =
    `${clear.length} clear wage violation${clear.length === 1 ? "" : "s"} totaling ` +
    `${usd(owed)} must be corrected before this run` +
    (human.length
      ? `; ${human.length} structural issue${human.length === 1 ? "" : "s"} need a human to quantify.`
      : ".");

  const polished = narrator
    ? await narrator({
        model: "sonnet",
        maxTokens: 120,
        system:
          "Write a single neutral sentence summarizing a payroll compliance review for a payroll " +
          "specialist. Keep the dollar figure exact. No preamble, no emojis.",
        prompt: fallback,
      })
    : null;

  return { findings: ranked, summary: polished ?? fallback };
}
