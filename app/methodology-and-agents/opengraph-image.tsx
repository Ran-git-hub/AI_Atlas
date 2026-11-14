import { ImageResponse } from "next/og"
import { readFileSync } from "node:fs"
import { join } from "node:path"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt =
  "Agents find it. Harnesses filter it. A human publishes it. Of about 11,400 candidates found, 1,718 passed validation and 700 were published on AI Atlas."

const LOGO_DATA_URL = (() => {
  try {
    const buf = readFileSync(join(process.cwd(), "public", "ai-atlas-logo.png"))
    return `data:image/png;base64,${buf.toString("base64")}`
  } catch {
    return null
  }
})()

const VIOLET = "#a78bfa"
const AMBER = "#e8a33d"
const GREEN = "#43cc93"
const DIM = "#5f748f"

/* The page ends with every candidate forming a globe, the published ones lit.
   This is that globe, drawn the same way: one dot per ten candidates on a
   Fibonacci sphere, 70 of the 1,140 in green. Only the near side is drawn. */
const N = 1140
const PUBLISHED = 70
const GLOBE = { cx: 944, cy: 312, r: 222 }
const DOTS = (() => {
  const out: { x: number; y: number; s: number; c: string; o: number }[] = []
  for (let i = 0; i < N; i++) {
    const j = (i * 397) % N
    const phi = Math.acos(1 - (2 * (j + 0.5)) / N)
    const th = Math.PI * (1 + Math.sqrt(5)) * j + 0.6
    const y = Math.cos(phi)
    const z = Math.sin(phi) * Math.sin(th)
    const depth = (y * 0.37 + z * 0.93 + 1) / 2
    if (depth < 0.42) continue
    const lit = i < PUBLISHED
    out.push({
      x: GLOBE.cx + Math.sin(phi) * Math.cos(th) * GLOBE.r,
      y: GLOBE.cy + (y * 0.93 - z * 0.37) * GLOBE.r,
      s: lit ? 5 + 6 * depth : 2.2 + 2.2 * depth,
      c: lit ? GREEN : "#7892b8",
      o: lit ? 0.35 + 0.65 * depth : 0.1 + 0.42 * depth,
    })
  }
  return out
})()

/* the candidates that never made it, as the drifting field behind the headline */
const DUST = (() => {
  let seed = 11
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  return Array.from({ length: 150 }, () => ({
    x: rnd() * 1200,
    y: rnd() * 630,
    s: 1.6 + rnd() * 2.6,
    o: 0.12 + rnd() * 0.3,
  }))
})()

const FUNNEL = [
  { v: "~11,400", l: "candidates found", c: VIOLET },
  { v: "1,718", l: "passed validation", c: AMBER },
  { v: "700", l: "published after human review", c: GREEN },
]

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #061022 0%, #020a18 60%, #020a18 100%)",
          color: "#f5f5f5",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          letterSpacing: "-0.01em",
          padding: "34px 56px 28px",
        }}
      >
        <div style={{ display: "flex", position: "absolute", inset: 0 }}>
          {DUST.map((d, i) => (
            <div
              key={`u${i}`}
              style={{
                display: "flex",
                position: "absolute",
                left: `${d.x}px`,
                top: `${d.y}px`,
                width: `${d.s}px`,
                height: `${d.s}px`,
                borderRadius: "50%",
                background: VIOLET,
                opacity: d.o,
              }}
            />
          ))}
          {DOTS.map((d, i) => (
            <div
              key={`g${i}`}
              style={{
                display: "flex",
                position: "absolute",
                left: `${d.x - d.s / 2}px`,
                top: `${d.y - d.s / 2}px`,
                width: `${d.s}px`,
                height: `${d.s}px`,
                borderRadius: "50%",
                background: d.c,
                opacity: d.o,
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {LOGO_DATA_URL && (
            <img
              src={LOGO_DATA_URL}
              width={34}
              height={34}
              alt="AI Atlas"
              style={{ borderRadius: "8px" }}
            />
          )}
          <span style={{ fontSize: "21px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            AI Atlas
          </span>
          <span
            style={{ fontSize: "15px", letterSpacing: "0.16em", color: "#22d3ee", marginLeft: "14px" }}
          >
            METHODOLOGY &amp; AGENTS
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "46px",
            fontSize: "74px",
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: "-0.045em",
          }}
        >
          <span style={{ color: VIOLET }}>Agents find it.</span>
          <span style={{ color: AMBER }}>Harnesses filter it.</span>
          <span style={{ color: GREEN }}>A human publishes it.</span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "44px", marginTop: "44px" }}>
          {FUNNEL.map((f) => (
            <div key={f.v} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span
                style={{ fontSize: "44px", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.04em", color: f.c }}
              >
                {f.v}
              </span>
              <span style={{ fontSize: "17px", color: "#9aaec8" }}>{f.l}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
          }}
        >
          <span style={{ fontSize: "15px", color: DIM }}>ai-atlas.app/methodology-and-agents</span>
          <span style={{ fontSize: "15px", color: DIM }}>
            Sourced by agents · published by a human
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
