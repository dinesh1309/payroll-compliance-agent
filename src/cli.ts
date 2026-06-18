// Entry point: bun run src/cli.ts [path-to-batch.json]
// Runs the agent over a payroll batch and prints the pre-flight review.

import type { Review } from "./types";
import { reviewBatch } from "./agent/orchestrator";
import { loadBatchFromFile } from "./tools/loadBatch";
import { requestApproval } from "./agent/humanGate";
import { createOpenRouterNarrator, isOpenRouterEnabled, openRouterModel } from "./llm/openrouter";
import { usd } from "./util";

const RULE_LABEL: Record<string, string> = {
  makeup_pay: "Makeup pay (sub-minimum after tips)",
  tip_credit_legality: "Illegal tip credit (state bans it)",
  eighty_twenty: "80/20 rule (non-tipped block)",
  notice: "Missing tip-credit notice",
  tip_pool: "Illegal tip pool",
  anomaly: "Anomaly (out-of-rule, flagged by model)",
};

const SEV_MARK: Record<string, string> = { high: "[HIGH]", medium: "[MED ]", low: "[LOW ]" };

function line(char = "─", n = 72): string {
  return char.repeat(n);
}

function render(review: Review): void {
  const t = review.totals;
  console.log(line("="));
  console.log(`  PAYROLL COMPLIANCE PRE-FLIGHT — ${review.group_name} (${review.batch_id})`);
  console.log(
    `  LLM language layer: ${isOpenRouterEnabled() ? `ON (${openRouterModel()} via OpenRouter)` : "OFF (deterministic prose)"}`,
  );
  console.log(line("="));
  console.log("");
  console.log(`  VERDICT: ${review.verdict}`);
  console.log(
    `  ${t.clear_violations} clear violation(s) · ${t.needs_human} need a human · ${t.clean_records} clean record(s)`,
  );
  console.log(`  Exact back wages owed:   ${usd(t.exact_owed)}`);
  console.log(`  Potential exposure (est): ${usd(t.potential_exposure)}  (liquidated damages if uncorrected)`);
  console.log("");

  console.log(line());
  console.log("  FINDINGS (ranked by dollars at risk)");
  console.log(line());
  if (review.findings.length === 0) {
    console.log("  None. Batch is clean.");
  }
  review.findings.forEach((f, i) => {
    console.log("");
    console.log(
      `  ${i + 1}. ${SEV_MARK[f.severity]} ${f.employee_name} — ${f.property_name} (${f.state})`,
    );
    console.log(`      ${RULE_LABEL[f.rule]}${f.workweek_start ? ` · week of ${f.workweek_start}` : ""}`);
    console.log(`      ${f.explanation}`);
    if (f.status === "clear") {
      console.log(`      EXACT OWED: ${usd(f.exact_owed)}   |  exposure est: ${usd(f.potential_exposure)}`);
    } else {
      console.log(`      NEEDS HUMAN — ${f.exposure_note}`);
    }
    if (f.correction) console.log(`      FIX: ${f.correction.note}`);
  });
  console.log("");

  console.log(line());
  console.log("  BY PROPERTY");
  console.log(line());
  for (const p of review.properties) {
    console.log(
      `  ${p.property_name} (${p.state}): ${p.finding_count} finding(s), ${usd(p.exact_owed)} owed`,
    );
  }
  console.log("");

  console.log(line());
  console.log("  NOTES");
  console.log(line());
  for (const n of review.notes) console.log(`  • ${n}`);
  console.log("");

  const gate = requestApproval(review);
  console.log(line("="));
  console.log(`  HUMAN GATE: ${gate.message}`);
  console.log(line("="));
}

async function main() {
  const path = process.argv[2] ?? "data/sample-batch.json";
  try {
    const batch = loadBatchFromFile(path);
    const narrator = createOpenRouterNarrator(); // undefined if no key → deterministic
    const review = await reviewBatch(batch, { narrator });
    render(review);
  } catch (e) {
    console.error(`\nError: ${(e as Error).message}\n`);
    process.exit(1);
  }
}

main();
