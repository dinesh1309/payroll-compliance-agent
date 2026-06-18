// Guarded LLM wrapper.
//
// The engine runs fully WITHOUT an API key. Every caller has a deterministic
// fallback. The LLM only ever improves language / classification — it never
// touches a dollar amount or a legal threshold. So results are identical with
// or without it; only the prose changes.

export function isLLMEnabled(): boolean {
  // Browser-safe: in the client bundle there is no key, so this is false and
  // every caller uses its deterministic fallback.
  return typeof process !== "undefined" && !!process.env?.ANTHROPIC_API_KEY;
}

export type LLMModel = "haiku" | "sonnet";

const MODEL_IDS: Record<LLMModel, string> = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
};

// Returns the model's text, or null if the LLM is unavailable / errors.
// Callers MUST handle null by using their deterministic fallback.
export async function complete(opts: {
  system: string;
  prompt: string;
  model?: LLMModel;
  maxTokens?: number;
}): Promise<string | null> {
  if (!isLLMEnabled()) return null;
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();
    const res = await client.messages.create({
      model: MODEL_IDS[opts.model ?? "haiku"],
      max_tokens: opts.maxTokens ?? 400,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
    });
    const block = res.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text.trim() : null;
  } catch {
    // Network/SDK/quota issue — fall back deterministically, never crash.
    return null;
  }
}
