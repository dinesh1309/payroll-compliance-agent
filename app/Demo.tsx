"use client";

import { useState } from "react";
import type { Batch, BatchRecord, Finding, Review, TraceEvent } from "@/src/types";
import { PHASE_ORDER, PHASE_LABELS } from "@/src/agent/phases";
import { seededStates } from "@/src/tools/stateRules";
import { requestApproval } from "@/src/agent/humanGate";
import { usd } from "@/src/util";
import { Pill } from "./components/Pill";
import { Donut } from "./components/Donut";
import { EditableGrid } from "./components/EditableGrid";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const RULE_LABEL: Record<Finding["rule"], string> = {
  makeup_pay: "Makeup pay",
  tip_credit_legality: "Illegal tip credit",
  eighty_twenty: "80/20 rule",
  notice: "Missing notice",
  tip_pool: "Illegal tip pool",
  anomaly: "Anomaly",
};
const DONUT_COLORS = ["#187468", "#2563eb", "#f59e0b", "#a5b4fc", "#ef4444", "#22c55e"];
const VERDICT: Record<Review["verdict"], { ring: string; text: string; blurb: string }> = {
  BLOCK: { ring: "border-bad-text/20 bg-bad-bg", text: "text-bad-text", blurb: "Clear violations found — do not submit until corrected." },
  REVIEW: { ring: "border-warn-text/20 bg-warn-bg", text: "text-warn-text", blurb: "Items need a human judgment before submitting." },
  CLEAR: { ring: "border-good-text/20 bg-good-bg", text: "text-good-text", blurb: "Nothing flagged — safe to submit." },
};

function modelShort(model: string): string {
  return (model.split("/").pop() || model).replace("-instruct", "");
}

// ---------- results sub-views ----------

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg bg-white/70 px-3 py-2">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${accent ?? "text-ink"}`}>{value}</div>
    </div>
  );
}

function VerdictBanner({ review }: { review: Review }) {
  const v = VERDICT[review.verdict];
  const t = review.totals;
  return (
    <div className={`rounded-xl2 border ${v.ring} p-5`}>
      <div className="flex items-center gap-3">
        <span className={`text-2xl font-extrabold tracking-tight ${v.text}`}>{review.verdict}</span>
        <span className="text-sm text-ink-soft">{v.blurb}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Exact back wages owed" value={usd(t.exact_owed)} accent="text-bad-text" />
        <Stat label="Potential exposure (est.)" value={usd(t.potential_exposure)} accent="text-warn-text" />
        <Stat label="Clear violations" value={String(t.clear_violations)} />
        <Stat label="Clean records" value={String(t.clean_records)} accent="text-good-text" />
      </div>
    </div>
  );
}

function FindingCard({ f }: { f: Finding }) {
  const tone = f.status === "needs_human" ? "warn" : f.severity === "high" ? "bad" : "warn";
  return (
    <div className="rounded-xl2 border border-line bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-ink">{f.employee_name}</div>
          <div className="text-xs text-ink-muted">
            {f.property_name} · {f.state}
            {f.workweek_start ? ` · week of ${f.workweek_start}` : ""}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Pill tone={tone as "warn" | "bad"}>{RULE_LABEL[f.rule]}</Pill>
          {f.status === "needs_human" ? <Pill tone="warn">needs human</Pill> : null}
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.explanation}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        {f.status === "clear" ? (
          <span className="text-sm text-ink-muted">
            Exact owed <span className="font-semibold tabular-nums text-bad-text">{usd(f.exact_owed)}</span>
            <span className="text-ink-muted"> · exposure est. {usd(f.potential_exposure)}</span>
          </span>
        ) : (
          <span className="text-sm text-warn-text">Human to quantify reclaim</span>
        )}
        {f.correction ? <span className="text-xs text-ink-muted">Fix: {f.correction.note}</span> : null}
      </div>
    </div>
  );
}

function Results({ review }: { review: Review }) {
  const gate = requestApproval(review);
  const slices = review.properties
    .filter((p) => p.exact_owed > 0)
    .map((p, i) => ({
      label: `${p.property_name} — ${usd(p.exact_owed)}`,
      value: p.exact_owed,
      color: DONUT_COLORS[i % DONUT_COLORS.length]!,
    }));
  return (
    <div className="mt-5">
      <VerdictBanner review={review} />
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h3 className="text-sm font-semibold text-ink-muted">Findings — ranked by dollars at risk</h3>
          {review.findings.length === 0 ? (
            <div className="rounded-xl2 border border-line bg-white p-6 text-center text-sm text-good-text shadow-card">
              No violations. This batch is clean.
            </div>
          ) : (
            review.findings.map((f) => <FindingCard key={f.id} f={f} />)
          )}
        </div>
        <div className="space-y-4">
          <div className="rounded-xl2 border border-line bg-white p-4 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-ink-muted">Liability by property</h3>
            {slices.length > 0 ? (
              <Donut slices={slices} centerLabel="owed" centerValue={usd(review.totals.exact_owed)} />
            ) : (
              <p className="text-sm text-good-text">No back wages owed.</p>
            )}
          </div>
          <div className="rounded-xl2 border border-brand-blue/20 bg-brand-tint p-4">
            <h3 className="text-sm font-semibold text-brand-navy">Human gate</h3>
            <p className="mt-1 text-sm text-ink-soft">{gate.message}</p>
            <button
              disabled
              className="mt-3 w-full cursor-not-allowed rounded-lg bg-brand-blue/40 px-3 py-2 text-sm font-semibold text-white"
            >
              Approve &amp; submit (specialist only)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- the live agent-run feed ----------

function EventRow({ e, model }: { e: TraceEvent; model: string }) {
  return (
    <div className="flex items-start gap-2 py-1 text-sm">
      <code className={`shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs ${e.flag ? "text-bad-text" : "text-ink-soft"}`}>
        {e.tool}
      </code>
      {e.target ? <span className="text-ink-muted">{e.target}</span> : null}
      <span className={`ml-auto text-right ${e.flag ? "font-medium text-bad-text" : "text-ink-soft"}`}>
        {e.detail}
      </span>
      <span
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
          e.via === "model" ? "bg-brand-tint text-brand-blue" : "bg-gray-100 text-ink-muted"
        }`}
        title={e.via === "model" ? `${model} via OpenRouter` : "deterministic code"}
      >
        {e.via === "model" ? modelShort(model) : "code"}
      </span>
    </div>
  );
}

function RunFeed({
  trace,
  revealed,
  status,
  model,
  llm,
}: {
  trace: TraceEvent[];
  revealed: number;
  status: "running" | "done";
  model: string;
  llm: boolean;
}) {
  const shown = trace.slice(0, revealed);
  const started = new Set(shown.map((e) => e.phase));
  const active = status === "running" && shown.length ? shown[shown.length - 1]!.phase : null;

  return (
    <div className="rounded-xl2 border border-line bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Agent run</h3>
        <span className="text-xs text-ink-muted">
          {llm ? `model: ${modelShort(model)} via OpenRouter` : "deterministic (no model key set)"}
        </span>
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-ink-muted">Starting agent…</p>
      ) : (
        <div className="space-y-3">
          {PHASE_ORDER.map((p, i) => {
            const evs = shown.filter((e) => e.phase === p);
            const state = !started.has(p)
              ? "pending"
              : status === "done" || active !== p
                ? "done"
                : "active";
            return (
              <div key={p} className={state === "pending" ? "opacity-40" : ""}>
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                      state === "done"
                        ? "bg-good-bg text-good-text"
                        : state === "active"
                          ? "bg-brand-blue text-white"
                          : "bg-gray-100 text-ink-muted"
                    }`}
                  >
                    {state === "done" ? "✓" : i + 1}
                  </span>
                  <span className="text-sm font-semibold text-ink">{PHASE_LABELS[p]}</span>
                  {state === "active" ? (
                    <span className="text-xs text-brand-blue animate-scan">running…</span>
                  ) : null}
                </div>
                {evs.length > 0 ? (
                  <div className="ml-7 mt-1 divide-y divide-line border-l-2 border-line pl-3">
                    {evs.map((e, j) => (
                      <EventRow key={`${p}-${j}`} e={e} model={model} />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- main ----------

export function Demo({ initialBatch }: { initialBatch: Batch }) {
  const [batch, setBatch] = useState<Batch>(initialBatch);
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [review, setReview] = useState<Review | null>(null);
  const [model, setModel] = useState("");
  const [llm, setLlm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const states = seededStates();

  async function run() {
    setStatus("running");
    setReview(null);
    setTrace([]);
    setRevealed(0);
    setError(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch }),
      });
      if (!res.ok) throw new Error(`Review failed (${res.status})`);
      const data = await res.json();
      const evs: TraceEvent[] = data.trace;
      setTrace(evs);
      setModel(data.model);
      setLlm(data.llm);
      for (let i = 1; i <= evs.length; i++) {
        setRevealed(i);
        await sleep(evs[i - 1]!.via === "model" ? 260 : 90);
      }
      setReview(data.review);
      setStatus("done");
    } catch (e) {
      setError((e as Error).message);
      setStatus("idle");
    }
  }

  function onEdit(index: number, patch: Partial<BatchRecord>) {
    setBatch((prev) => ({
      ...prev,
      records: prev.records.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
    if (status !== "running") {
      setStatus("idle");
      setReview(null);
      setRevealed(0);
    }
  }

  const runLabel = status === "running" ? "Running…" : status === "done" ? "Re-run review" : "Run pre-flight review";

  return (
    <section className="mx-auto w-full max-w-5xl px-4">
      {/* control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-line bg-white p-4 shadow-card">
        <div>
          <div className="text-sm font-semibold text-ink">{batch.group_name}</div>
          <div className="text-xs text-ink-muted">
            {batch.records.length} employee-weeks · {batch.properties.length} properties · sample batch
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === "done" ? (
            <button
              onClick={() => setBatch(initialBatch)}
              className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:bg-gray-50"
            >
              Reset
            </button>
          ) : null}
          <button
            onClick={run}
            disabled={status === "running"}
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-bluedark disabled:opacity-60"
          >
            {status !== "running" ? "▶ " : ""}
            {runLabel}
          </button>
        </div>
      </div>

      {status === "idle" && !review ? (
        <p className="mt-3 text-center text-sm text-ink-muted">
          Press <span className="font-medium text-ink">Run</span> to watch the agent work the batch step by step,
          then see the verdict.
        </p>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl2 border border-bad-text/20 bg-bad-bg p-4 text-sm text-bad-text">
          {error}
        </div>
      ) : null}

      {status !== "idle" ? (
        <div className="mt-4">
          <RunFeed trace={trace} revealed={revealed} status={status} model={model} llm={llm} />
        </div>
      ) : null}

      {status === "done" && review ? <Results review={review} /> : null}

      {/* editable grid */}
      <div className="mt-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-ink">Edit the batch, then re-run</h3>
          <span className="text-xs text-ink-muted">
            try: change Maria&apos;s tips, or flip David Kim&apos;s state to TX
          </span>
        </div>
        <EditableGrid records={batch.records} states={states} onEdit={onEdit} />
      </div>
    </section>
  );
}
