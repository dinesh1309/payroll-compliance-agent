import type { Batch, TraceEvent } from "@/src/types";
import { reviewBatch } from "@/src/agent/orchestrator";
import {
  createOpenRouterNarrator,
  isOpenRouterEnabled,
  openRouterModel,
} from "@/src/llm/openrouter";

export const runtime = "nodejs";

// Tiny in-memory cache so repeat runs of an unedited batch don't re-bill the
// model. Keyed by the records' content; edited data misses and runs live.
const cache = new Map<string, unknown>();

export async function POST(req: Request) {
  let body: { batch?: Batch };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const batch = body.batch;
  if (!batch || !Array.isArray(batch.records)) {
    return Response.json({ error: "Missing batch.records" }, { status: 400 });
  }

  const key = JSON.stringify(batch.records);
  if (cache.has(key)) return Response.json(cache.get(key));

  const trace: TraceEvent[] = [];
  const narrator = createOpenRouterNarrator(); // undefined if no key → deterministic
  try {
    const review = await reviewBatch(batch, { narrator, onEvent: (e) => trace.push(e) });
    const payload = {
      review,
      trace,
      model: openRouterModel(),
      llm: isOpenRouterEnabled(),
    };
    cache.set(key, payload);
    return Response.json(payload);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
