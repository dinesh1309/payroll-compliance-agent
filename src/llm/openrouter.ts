// OpenRouter-backed narrator. Server-side only (the key never reaches the client).
// Reuses the same account/pattern as the ICP CRM project: one key → any open model,
// swappable via OPENROUTER_MODEL. The narrator only writes language; it never touches
// the math or the law. Returns null on any failure so callers fall back deterministically.

import type { Narrator } from "../types";

const DEFAULT_MODEL = "qwen/qwen3-235b-a22b-2507";

export function openRouterModel(): string {
  return (typeof process !== "undefined" && process.env.OPENROUTER_MODEL) || DEFAULT_MODEL;
}

export function isOpenRouterEnabled(): boolean {
  return typeof process !== "undefined" && !!process.env.OPENROUTER_API_KEY;
}

export function createOpenRouterNarrator(): Narrator | undefined {
  const key = typeof process !== "undefined" ? process.env.OPENROUTER_API_KEY : undefined;
  if (!key) return undefined;
  const model = openRouterModel();

  return async ({ system, prompt, maxTokens }) => {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "X-Title": "Payroll Compliance Pre-Flight",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens ?? 200,
          temperature: 0, // lean deterministic — same input, same wording, run to run
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      return typeof text === "string" ? text.trim() : null;
    } catch {
      return null;
    }
  };
}
