// Shared shape for what a check produces before triage / liability / correction.

import type { BatchRecord, Finding } from "../../types";

export type RawFinding = Pick<
  Finding,
  | "rule"
  | "employee_id"
  | "employee_name"
  | "property_id"
  | "property_name"
  | "state"
  | "workweek_start"
  | "status"
  | "exact_owed"
  | "explanation"
>;

export function identity(record: BatchRecord) {
  return {
    employee_id: record.employee_id,
    employee_name: record.employee_name,
    property_id: record.property_id,
    property_name: record.property_name,
    state: record.state,
    workweek_start: record.workweek_start,
  };
}
