import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Payroll Compliance Pre-Flight — built for Netchex";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#2563eb" }} />
            <div style={{ marginLeft: 16, fontSize: 30, fontWeight: 600, color: "#1f2937" }}>
              Payroll Compliance Pre-Flight
            </div>
          </div>
          <div
            style={{
              display: "flex",
              background: "#eef2ff",
              color: "#2563eb",
              fontSize: 24,
              fontWeight: 700,
              padding: "10px 22px",
              borderRadius: 999,
            }}
          >
            Built for Netchex
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 66, fontWeight: 800, color: "#1f2937", lineHeight: 1.08 }}>
            Catch the payroll mistakes
          </div>
          <div style={{ fontSize: 66, fontWeight: 800, color: "#1f2937", lineHeight: 1.08 }}>
            before they break trust.
          </div>
          <div style={{ marginTop: 22, fontSize: 28, color: "#6b7280", maxWidth: 980 }}>
            An agent that flags tip-credit and tipped-minimum-wage violations before a multi-location
            run — exact dollars, with a human gate.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", color: "#6b7280", fontSize: 24 }}>
          <div style={{ display: "flex", color: "#15803d", fontWeight: 700 }}>Deterministic engine</div>
          <div style={{ margin: "0 14px" }}>·</div>
          <div style={{ display: "flex", color: "#2563eb", fontWeight: 700 }}>LLM judgment (OpenRouter)</div>
          <div style={{ margin: "0 14px" }}>·</div>
          <div style={{ display: "flex", color: "#b45309", fontWeight: 700 }}>Human-in-the-loop</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
