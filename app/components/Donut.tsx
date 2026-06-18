// A small SVG donut, echoing Netchex's Payment History chart. No dependencies.

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function Donut({ slices, centerLabel, centerValue }: {
  slices: DonutSlice[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 56;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
        <g transform="translate(70,70) rotate(-90)">
          <circle r={r} fill="none" stroke="#eef1f6" strokeWidth="16" />
          {slices.map((s) => {
            const len = (s.value / total) * c;
            const dash = `${len} ${c - len}`;
            const circle = (
              <circle
                key={s.label}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="16"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return circle;
          })}
        </g>
        <text x="70" y="64" textAnchor="middle" className="fill-ink-muted" fontSize="10">
          {centerLabel}
        </text>
        <text x="70" y="82" textAnchor="middle" className="fill-ink font-semibold" fontSize="15">
          {centerValue}
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-ink-soft">{s.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
