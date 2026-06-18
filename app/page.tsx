import type { Batch } from "@/src/types";
import sampleJson from "@/data/sample-batch.json";
import { Demo } from "./Demo";

export default function Page() {
  const batch = sampleJson as unknown as Batch;

  return (
    <main className="min-h-screen pb-20">
      {/* top bar */}
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-5 w-5 rounded-md bg-brand-blue" />
            <span className="font-semibold text-ink">Payroll Compliance Pre-Flight</span>
          </div>
          <span className="rounded-full bg-brand-tint px-3 py-1 text-xs font-semibold text-brand-blue">
            Built for Netchex
          </span>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-5xl px-4 pb-8 pt-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
          Applied AI · multi-location hospitality payroll
        </p>
        <h1 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
          Catch the payroll mistakes before they break trust.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
          A pre-flight agent that reviews a multi-location hospitality payroll run and flags every
          tip-credit and tipped-minimum-wage violation — with the exact dollars owed — before anyone
          hits submit. Run it on the sample below, or edit any number and watch it recompute live.
        </p>
        <p className="mt-3 max-w-2xl text-sm italic text-ink-muted">
          &ldquo;Most companies don&apos;t switch payroll providers because of new features. They
          switch when trust breaks.&rdquo; This catches the payroll mistakes that break it.
        </p>
      </section>

      {/* the live demo */}
      <Demo initialBatch={batch} />

      {/* why I built this */}
      <section className="mx-auto mt-16 max-w-5xl px-4">
        <div className="rounded-xl2 border border-line bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-ink">Why I built this</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
            <p>
              I started from your team&apos;s own words. <strong>Saurabh Nangia (CPO)</strong> put
              it plainly: companies switch when <em>trust breaks</em>, and the number-one
              trust-breaker is <em>payroll mistakes</em>. <strong>Abhinav Agrawal (CEO)</strong>
              keeps pointing at the same customer — multi-location, frontline, multi-state
              operators. And your blog names the sharpest version of the pain: &ldquo;the tip rules
              most hospitality operators get wrong.&rdquo;
            </p>
            <p>
              So I mapped the real workflow — the per-week makeup-pay math, the states that ban the
              tip credit outright, the 80/20 rule, tip-pool legality, the notice requirement — and
              built an agent that catches exactly those mistakes before a run goes out.
            </p>
            <p className="font-medium text-ink">
              That is the combination this role is hiring for: product judgment (which problem, in
              your language) plus applied AI (a real agent that ships and moves a metric) — not a
              slide, not a prototype.
            </p>
          </div>
        </div>

        {/* under the hood */}
        <details className="group mt-4 rounded-xl2 border border-line bg-white p-6 shadow-card">
          <summary className="cursor-pointer list-none text-lg font-bold text-ink">
            Under the hood
            <span className="ml-2 text-sm font-normal text-ink-muted group-open:hidden">
              (how it actually works)
            </span>
          </summary>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold text-ink">Why the numbers are exact</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                Every legal threshold and every dollar is computed in a deterministic rules engine —
                same input, same answer, always. A lawyer could read the code and agree. The model
                never touches the math.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-ink">Why it&apos;s an agent, not a chatbot</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                It owns the workflow: sense → compute → decide → act → loop. The orchestration
                guarantees every record runs through every applicable check — no employee silently
                skipped.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-ink">Where the model genuinely decides</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                The closed rule set, all the math, and role classification are deterministic code —
                same input, same answer, every run. We deliberately keep the model out of those:
                a model that flip-flops on an ambiguous title would change the result. The model
                decides only where the space is open and additive: scanning for out-of-rule
                anomalies a human should verify. It can flag or escalate — never skip or alter a number.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-ink">The human stays in control</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                The agent drafts corrections and stops at the gate. It never applies a change or
                submits payroll — matching the bar Netchex sets: AI automates the task, it does not
                replace payroll judgment.
              </p>
            </div>
          </div>
        </details>

        {/* footer */}
        <footer className="mt-8 rounded-xl2 border border-line bg-white p-6 text-sm text-ink-soft shadow-card">
          <p>
            Built by <span className="font-semibold text-ink">P V Dinesh</span> for the Applied AI
            Product Leader role. The compliance engine is deterministic and open — the model only
            writes language and flags anomalies. Happy to walk through how I&apos;d build the GTM,
            CS, and Finance versions of this.
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            <a
              className="font-medium text-brand-blue hover:underline"
              href="https://pvdinesh.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              pvdinesh.com →
            </a>
            <a
              className="font-medium text-brand-blue hover:underline"
              href="https://www.linkedin.com/in/pvdinesh/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn →
            </a>
            <a
              className="font-medium text-brand-blue hover:underline"
              href="https://github.com/dinesh1309/payroll-compliance-agent"
              target="_blank"
              rel="noopener noreferrer"
            >
              Engine source on GitHub →
            </a>
          </div>
        </footer>
      </section>
    </main>
  );
}
