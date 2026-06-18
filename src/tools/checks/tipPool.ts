// Check: check_tip_pool  [code, deterministic]
//
// Tip-pool legality is a property-level check, not a single-record one.
//   - Managers / supervisors can NEVER share in a tip pool.
//   - Back-of-house (non-tipped) staff cannot be in a pool when the employer
//     claims a tip credit for the tipped members.
// We can flag the illegal structure deterministically, but the dollars to
// reclaim depend on the pool's actual distribution (not in this batch), so
// these are routed to a human to quantify.

import type { Batch, RoleType } from "../../types";
import type { RawFinding } from "./_base";

export function checkTipPool(
  batch: Batch,
  roleByEmployee: Map<string, RoleType>,
): RawFinding[] {
  const findings: RawFinding[] = [];

  // One representative record per employee, for identity.
  const recordByEmployee = new Map<string, Batch["records"][number]>();
  for (const r of batch.records) {
    if (!recordByEmployee.has(r.employee_id)) recordByEmployee.set(r.employee_id, r);
  }

  for (const pool of batch.tip_pools) {
    const memberRecords = pool.member_employee_ids
      .map((id) => recordByEmployee.get(id))
      .filter((r): r is Batch["records"][number] => !!r);

    const creditClaimedInPool = memberRecords.some((r) => r.tip_credit_claimed);

    for (const r of memberRecords) {
      const role = roleByEmployee.get(r.employee_id) ?? "non_tipped";
      const base = {
        rule: "tip_pool" as const,
        employee_id: r.employee_id,
        employee_name: r.employee_name,
        property_id: r.property_id,
        property_name: r.property_name,
        state: r.state,
        workweek_start: null,
        status: "needs_human" as const,
        exact_owed: 0,
      };

      if (role === "manager") {
        findings.push({
          ...base,
          explanation:
            `${r.employee_name} (${r.job_title}) is a manager/supervisor included in tip pool ` +
            `${pool.tip_pool_id}. Managers may never share in a tip pool under any circumstances. ` +
            `Remove from the pool and reclaim improperly distributed tips — amount needs the pool's ` +
            `distribution detail (human to quantify).`,
        });
      } else if (role === "non_tipped" && creditClaimedInPool) {
        findings.push({
          ...base,
          explanation:
            `${r.employee_name} (${r.job_title}) is back-of-house / non-tipped but is in tip pool ` +
            `${pool.tip_pool_id} while a tip credit is claimed for tipped members. That invalidates ` +
            `the pool. Either drop the tip credit or remove BOH from the pool — improperly retained ` +
            `amount needs the pool's distribution detail (human to quantify).`,
        });
      }
    }
  }

  return findings;
}
