// Small deterministic helpers. Money is always rounded to cents the same way.

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Deterministic currency formatting — identical on server and client (no
// Intl/locale dependence), so it can never cause a hydration mismatch.
export function usd(n: number): string {
  const neg = n < 0;
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  const withCommas = int!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${neg ? "-$" : "$"}${withCommas}.${dec}`;
}
