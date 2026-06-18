"use client";

import type { BatchRecord } from "@/src/types";
import { Pill } from "./Pill";

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

const TH = "px-3 py-2 text-left text-xs font-semibold text-ink-muted whitespace-nowrap";
const TD = "px-3 py-2 align-middle whitespace-nowrap";
const NUM_INPUT =
  "w-20 rounded-md border border-line bg-white px-2 py-1 text-sm text-right tabular-nums focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue";

export function EditableGrid({
  records,
  states,
  onEdit,
}: {
  records: BatchRecord[];
  states: string[];
  onEdit: (index: number, patch: Partial<BatchRecord>) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl2 border border-line bg-white shadow-card">
      <table className="min-w-full divide-y divide-line">
        <thead className="bg-gray-50">
          <tr>
            <th className={TH}>Employee</th>
            <th className={TH}>Property</th>
            <th className={TH}>State</th>
            <th className={`${TH} text-right`}>Tipped hrs</th>
            <th className={`${TH} text-right`}>Tips ($)</th>
            <th className={`${TH} text-right`}>Cash $/hr</th>
            <th className={`${TH} text-center`}>Tip credit?</th>
            <th className={`${TH} text-center`}>Notice?</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {records.map((r, i) => (
            <tr key={`${r.employee_id}-${r.workweek_start}`} className="hover:bg-brand-tint/30">
              <td className={TD}>
                <div className="font-medium text-brand-blue">{r.employee_name}</div>
                <div className="text-xs text-ink-muted">
                  {r.job_title} · wk {r.workweek_start.slice(5)}
                </div>
              </td>
              <td className={TD}>
                <span className="text-sm text-ink-soft">{r.property_name}</span>
              </td>
              <td className={TD}>
                <select
                  value={r.state}
                  onChange={(e) => onEdit(i, { state: e.target.value })}
                  className="rounded-md border border-line bg-white px-2 py-1 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                >
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className={`${TD} text-right`}>
                <input
                  type="number"
                  className={NUM_INPUT}
                  value={r.tipped_hours}
                  onChange={(e) => onEdit(i, { tipped_hours: num(e.target.value) })}
                />
              </td>
              <td className={`${TD} text-right`}>
                <input
                  type="number"
                  className={NUM_INPUT}
                  value={r.tips_reported}
                  onChange={(e) => onEdit(i, { tips_reported: num(e.target.value) })}
                />
              </td>
              <td className={`${TD} text-right`}>
                <input
                  type="number"
                  step="0.01"
                  className={NUM_INPUT}
                  value={r.cash_wage_rate}
                  onChange={(e) => onEdit(i, { cash_wage_rate: num(e.target.value) })}
                />
              </td>
              <td className={`${TD} text-center`}>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-blue"
                  checked={r.tip_credit_claimed}
                  onChange={(e) => onEdit(i, { tip_credit_claimed: e.target.checked })}
                />
              </td>
              <td className={`${TD} text-center`}>
                {r.tip_credit_claimed ? (
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-blue"
                    checked={r.tip_credit_notice_on_file}
                    onChange={(e) => onEdit(i, { tip_credit_notice_on_file: e.target.checked })}
                  />
                ) : (
                  <Pill tone="neutral">n/a</Pill>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
