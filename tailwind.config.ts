import type { Config } from "tailwindcss";

// Tokens pulled from Netchex's actual product UI (Start Payroll / OneScreen):
// blue actions, charcoal headings, and green / amber / red / gray status pills.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#1e3a8a",
          blue: "#2563eb",
          bluedark: "#1d4ed8",
          tint: "#eef2ff",
        },
        ink: {
          DEFAULT: "#1f2937",
          soft: "#374151",
          muted: "#6b7280",
        },
        good: { text: "#15803d", bg: "#dcfce7", dot: "#22c55e" },
        warn: { text: "#b45309", bg: "#fef3c7", dot: "#f59e0b" },
        bad: { text: "#dc2626", bg: "#fee2e2", dot: "#ef4444" },
        teal: "#187468",
        line: "#e5e7eb",
        canvas: "#f6f7fb",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)",
      },
      borderRadius: {
        xl2: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
