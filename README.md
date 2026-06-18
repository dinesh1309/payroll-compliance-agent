# Payroll Compliance Pre-Flight Agent

An agent that reviews a multi-location hospitality payroll batch **before it is submitted**
and flags tip-credit / tipped-minimum-wage violations — the payroll mistakes that create
wage-and-hour liability. It computes the exact dollars owed, explains each issue in plain
English, and routes corrections to a human for approval.

Built as a demonstration of applied-AI product work: a **deterministic compliance core**
orchestrated by an **agent**, with the **LLM used only for judgment and language** — never
for the math or the law.

## Run it

```bash
bun install        # first time only
bun run dev        # → http://localhost:3000  (press "Run" to start the agent)
```

The agent is gated behind a **Run** trigger: press it to watch the 5 steps and their
tool calls execute live, then see the verdict.

### Model (OpenRouter)

`.env.local` holds `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` (default
`qwen/qwen3-235b-a22b-2507`). The LLM only writes language — law and math are always
deterministic code, so it also runs with no key (deterministic fallback). Swap models with:

```bash
# .env.local
OPENROUTER_MODEL=moonshotai/kimi-k2   # or meta-llama/llama-3.3-70b-instruct, etc.
```

CLI version of the engine (no UI):

```bash
bun run review data/sample-batch.json
```

Production build (what Vercel runs):

```bash
bun run build && bun run start
```

`bun run start` needs `bun run build` to have produced a `.next/` folder first —
if you see "Could not find a production build", run `bun run build`, or just use `bun run dev`.

## Layout

- `src/` — the engine (CLI + browser). `src/agent/orchestrator.ts` is the agent loop.
- `app/` — the Next.js UI (Netchex product design tokens).
- `data/` — sample batch + state rules.
- **Design, architecture, plan, and all project docs live in the PVD vault**, not here:
  `pvd-vault/atlas/projects/netchex-applied-ai-role/`.

Status: engine + UI built and verified. Next: deploy to Vercel.
