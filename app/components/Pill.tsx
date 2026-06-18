type Tone = "good" | "warn" | "bad" | "neutral" | "blue";

const TONES: Record<Tone, string> = {
  good: "bg-good-bg text-good-text",
  warn: "bg-warn-bg text-warn-text",
  bad: "bg-bad-bg text-bad-text",
  neutral: "bg-gray-100 text-ink-muted",
  blue: "bg-brand-tint text-brand-blue",
};

export function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
