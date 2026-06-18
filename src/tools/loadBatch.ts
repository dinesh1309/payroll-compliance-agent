// Tool: load_batch  [code, deterministic]
// Validation is separated from file I/O so the same logic runs in the browser
// (parseBatch over an in-memory object) and the CLI (loadBatchFromFile).

import { readFileSync } from "node:fs";
import type { Batch } from "../types";

const REQUIRED_RECORD_FIELDS = [
  "employee_id",
  "employee_name",
  "property_id",
  "state",
  "job_title",
  "workweek_start",
  "tipped_hours",
  "cash_wage_rate",
  "tips_reported",
  "tip_credit_claimed",
] as const;

export function parseBatch(raw: unknown): Batch {
  const batch = raw as Batch;
  if (!batch || !Array.isArray(batch.records)) {
    throw new Error("Batch is missing a 'records' array.");
  }
  batch.records.forEach((r, i) => {
    for (const f of REQUIRED_RECORD_FIELDS) {
      if ((r as unknown as Record<string, unknown>)[f] === undefined) {
        throw new Error(`Record ${i} (${r.employee_name ?? "?"}) is missing field '${f}'.`);
      }
    }
  });
  if (!Array.isArray(batch.tip_pools)) batch.tip_pools = [];
  return batch;
}

export function loadBatchFromFile(path: string): Batch {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new Error(`Could not read/parse batch file at ${path}: ${(e as Error).message}`);
  }
  return parseBatch(raw);
}
