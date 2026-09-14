import { ImageResponse } from "next/og"
import { readFileSync } from "node:fs"
import { join } from "node:path"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt =
  "The agent architecture behind AI Atlas: four pipeline stages fed by a shared reference layer, the discards that feed back into search, and a human review before anything is published"

const LOGO_DATA_URL = (() => {
  try {
    const buf = readFileSync(join(process.cwd(), "public", "ai-atlas-logo.png"))
    return `data:image/png;base64,${buf.toString("base64")}`
  } catch {
    return null
  }
})()

const HERMES = "#22d3ee"
const PM = "#43cc93"
const HUMAN = "#e8a33d"
const ROSE = "#f2607a"
const DIM = "#5f748f"
const WIRE = "rgba(255,255,255,0.20)"

/* Node skins copied from the canvas stylesheet so the card reads as the same
   drawing: one dark fill per kind, a hairline stroke, accent only in the
   eyebrow. */
const KIND = {
  step: { fill: "#0b1526", stroke: "#22304d", radius: 11, dash: false },
  know: { fill: "#0a1526", stroke: "#243a5c", radius: 9, dash: true },
  sink: { fill: "#0a1322", stroke: "#2a3a55", radius: 9, dash: false },
  io: { fill: "#08111f", stroke: "#2a3a55", radius: 9, dash: true },
  job: { fill: "#091628", stroke: "#2c4463", radius: 9, dash: false },
  human: { fill: "#1a1408", stroke: HUMAN, radius: 11, dash: false },
} as const

const STAGE_W = 152
const STAGE_GAP = 20
const INNER_W = STAGE_W * 4 + STAGE_GAP * 3 // 668
const centre = (i: number) => i * (STAGE_W + STAGE_GAP) + STAGE_W / 2

const STAGES = [
  { n: "01", name: "Search", accent: "#a78bfa", line: "casts the day's net" },
  { n: "02", name: "Validate", accent: "#e8a33d", line: "judges against the bar" },
  { n: "03", name: "Persist", accent: "#43cc93", line: "records each survivor" },
  { n: "04", name: "Report", accent: "#22d3ee", line: "says what happened" },
]

function Grid() {
  const v = Array.from({ length: 15 }, (_, i) => (i + 1) * 75)
  const h = Array.from({ length: 8 }, (_, i) => (i + 1) * 70)
  return (
    <div style={{ display: "flex", position: "absolute", inset: 0 }}>
      {v.map((x) => (
        <div
          key={`v${x}`}
          style={{
            display: "flex",
            position: "absolute",
            left: `${x}px`,
            top: 0,
            width: "1px",
            height: "630px",
            background: "rgba(255,255,255,0.04)",
          }}
        />
      ))}
      {h.map((y) => (
        <div
          key={`h${y}`}
          style={{
            display: "flex",
            position: "absolute",
            top: `${y}px`,
            left: 0,
            height: "1px",
            width: "1200px",
            background: "rgba(255,255,255,0.04)",
          }}
        />
      ))}
    </div>
  )
}

function Head({ dir, color }: { dir: "r" | "l" | "d"; color: string }) {
  if (dir === "d")
    return (
      <div
        style={{
          display: "flex",
          width: "0px",
          height: "0px",
          borderLeft: "3.5px solid transparent",
          borderRight: "3.5px solid transparent",
          borderTop: `5px solid ${color}`,
        }}
      />
    )
  const base = {
    display: "flex",
    width: "0px",
    height: "0px",
    borderTop: "3.5px solid transparent",
    borderBottom: "3.5px solid transparent",
  } as const
  return dir === "r" ? (
    <div style={{ ...base, borderLeft: `5px solid ${color}` }} />
  ) : (
    <div style={{ ...base, borderRight: `5px solid ${color}` }} />
  )
}

function Wire({ w, color = WIRE }: { w: number; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", width: `${w}px` }}>
      <div style={{ display: "flex", width: `${w - 5}px`, height: "1.2px", background: color }} />
      <Head dir="r" color={color} />
    </div>
  )
}

function Tick({ color, h = 10 }: { color: string; h?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", width: "1px", height: `${h}px`, background: color }} />
      <Head dir="d" color={color} />
    </div>
  )
}

function Node({
  kind,
  w,
  h,
  eyebrow,
  accent,
  title,
  role,
  line,
  stroke,
}: {
  kind: keyof typeof KIND
  w: number
  h?: number
  eyebrow?: string
  accent?: string
  title: string
  role?: string
  line?: string
  stroke?: string
}) {
  const k = KIND[kind]
  const step = kind === "step" || kind === "human"
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: `${w}px`,
        ...(h ? { height: `${h}px` } : {}),
        borderRadius: `${k.radius}px`,
        border: `${kind === "human" ? 1.6 : 1.2}px ${k.dash ? "dashed" : "solid"} ${
          stroke ?? k.stroke
        }`,
        background: k.fill,
        padding: step ? "0 14px" : "0 13px",
      }}
    >
      {eyebrow && (
        <span
          style={{
            fontSize: "10.5px",
            letterSpacing: "0.17em",
            color: accent ?? HERMES,
            marginBottom: "5px",
          }}
        >
          {eyebrow}
        </span>
      )}
      <span
        style={{
          fontSize: step ? "18px" : kind === "know" ? "13.5px" : "15px",
          fontWeight: 600,
          color: "#e6edf7",
          letterSpacing: "-0.015em",
        }}
      >
        {title}
      </span>
      {role && (
        <span style={{ fontSize: "11.5px", color: "#8ba0bd", marginTop: "3px" }}>{role}</span>
      )}
      {line && (
        <span
          style={{
            fontSize: kind === "step" || kind === "human" ? "11.5px" : "11px",
            color: role ? DIM : kind === "know" ? "#7d93b1" : "#8ba0bd",
            marginTop: "3px",
          }}
        >
          {line}
        </span>
      )}
    </div>
  )
}

function BandHead({
  color,
  label,
  note,
}: {
  color: string
  label: string
  note: string
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            display: "flex",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: color,
          }}
        />
        <span style={{ fontSize: "13px", letterSpacing: "0.16em", color }}>{label}</span>
      </div>
      <span style={{ fontSize: "12px", letterSpacing: "0.11em", color: DIM }}>{note}</span>
    </div>
  )
}

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
          background:
            "linear-gradient(135deg, #071225 0%, #0b1c30 38%, #051023 72%, #020a18 100%)",
          color: "#f5f5f5",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          letterSpacing: "-0.01em",
          padding: "30px 52px 24px",
        }}
      >
        <Grid />

        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {LOGO_DATA_URL && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={LOGO_DATA_URL}
                width={32}
                height={32}
                alt="AI Atlas"
                style={{ borderRadius: "8px" }}
              />
            )}
            <span style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              AI Atlas
            </span>
          </div>
          <span style={{ fontSize: "15px", letterSpacing: "0.15em", color: "#7d90a4" }}>
            THE AGENT ARCHITECTURE
          </span>
        </div>

        <p
          style={{
            margin: "14px 0 0",
            fontSize: "44px",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
          }}
        >
          Methodology &amp; Agents
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "0px", marginTop: "34px" }}>
          {/* the source, outside every band — nothing here is under the pipeline's control */}
          <Node
            kind="io"
            w={152}
            h={72}
            title="The open web"
            role="Where evidence lives"
            line="News and case studies"
          />
          <Wire w={22} />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: `${INNER_W + 36}px`,
              borderRadius: "12px",
              border: `1px solid ${HERMES}3d`,
              background: "rgba(34,211,238,0.045)",
              padding: "12px 18px 14px",
            }}
          >
            <BandHead
              color={HERMES}
              label="AI-ATLAS OPS · HERMES AGENT"
              note="RUNS EVERY DAY"
            />

            {/* reference layer: read by every stage, never written through */}
            <div style={{ display: "flex", gap: `${STAGE_GAP}px`, marginTop: "10px" }}>
              <Node
                kind="know"
                w={STAGE_W}
                h={46}
                title="Query design"
                line="layers · rotation · retired"
              />
              <Node
                kind="know"
                w={STAGE_W * 3 + STAGE_GAP * 2}
                h={46}
                title="Learnings record"
                line="the memory of the run — every stage reads it, every stage writes back"
              />
            </div>

            <div
              style={{ display: "flex", position: "relative", height: "14px", width: `${INNER_W}px` }}
            >
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  left: `${centre(0)}px`,
                  top: "6px",
                  width: `${centre(3) - centre(0)}px`,
                  height: "1px",
                  background: `${HERMES}4d`,
                }}
              />
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    position: "absolute",
                    left: `${centre(i) - 3.5}px`,
                    top: "0px",
                  }}
                >
                  <Tick color={`${HERMES}80`} h={8} />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              {STAGES.map((s, i) => (
                <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
                  {i > 0 && <Wire w={STAGE_GAP} />}
                  <Node
                    kind="step"
                    w={STAGE_W}
                    h={70}
                    eyebrow={`STAGE ${s.n}`}
                    accent={s.accent}
                    title={s.name}
                    line={s.line}
                  />
                </div>
              ))}
            </div>

            {/* what falls out, hung off the stage that produces it */}
            <div
              style={{
                display: "flex",
                position: "relative",
                height: "62px",
                width: `${INNER_W}px`,
                marginTop: "7px",
              }}
            >
              {[
                { i: 1, t: "Discarded", r: "Most of what a day finds", c: ROSE },
                { i: 2, t: "Already known", r: "Never re-ingested", c: HUMAN },
              ].map((s) => (
                <div
                  key={s.t}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "absolute",
                    left: `${centre(s.i) - 82}px`,
                    top: "0px",
                  }}
                >
                  <Tick color={`${s.c}b3`} h={8} />
                  <div style={{ display: "flex", marginTop: "4px" }}>
                    <Node kind="sink" w={164} h={44} title={s.t} line={s.r} stroke={`${s.c}99`} />
                  </div>
                </div>
              ))}
            </div>

            {/* the loop that makes the discards worth keeping */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: `${INNER_W}px`,
                marginTop: "6px",
              }}
            >
              <Head dir="l" color={`${ROSE}b3`} />
              <div style={{ display: "flex", width: "9px", height: "1.2px", background: `${ROSE}80` }} />
              <span
                style={{
                  fontSize: "11.5px",
                  letterSpacing: "0.08em",
                  color: "#a8808e",
                  padding: "0 8px",
                }}
              >
                DISCARDED &amp; ARCHIVED — EXCLUDED FROM LATER SEARCHES
              </span>
              <div style={{ display: "flex", flex: 1, height: "1.2px", background: `${ROSE}3d` }} />
            </div>
          </div>

          <Wire w={22} color={`${HUMAN}b3`} />

          {/* the one box that is not an agent, and its two exits */}
          <div style={{ display: "flex", flexDirection: "column", width: "186px" }}>
            <Node
              kind="human"
              w={186}
              h={70}
              eyebrow="HUMAN IN THE LOOP"
              accent={HUMAN}
              title="Review"
              line="A person decides, every time"
            />
            <div style={{ display: "flex", justifyContent: "center", marginTop: "5px" }}>
              <Tick color={`${HUMAN}99`} h={9} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "5px" }}>
              <Node
                kind="sink"
                w={186}
                h={44}
                title="Published"
                line="Part of the atlas"
                stroke={`${PM}99`}
              />
              <Node
                kind="sink"
                w={186}
                h={44}
                title="Archived"
                line="Kept, hidden, remembered"
                stroke={`${ROSE}99`}
              />
            </div>
          </div>
        </div>

        {/* the band that sets the standard and owns the dataset */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "20px",
            borderRadius: "12px",
            border: `1px solid ${PM}3d`,
            background: "rgba(67,204,147,0.045)",
            padding: "11px 18px 13px",
          }}
        >
          <BandHead
            color={PM}
            label="AI-ATLAS PM · OPENCLAW AGENT"
            note="SETS THE STANDARD · OWNS THE DATASET"
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "9px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Node kind="know" w={116} h={36} title="Quality bar" />
              <Node kind="know" w={126} h={36} title="Data standard" />
              <Wire w={18} color={`${PM}8c`} />
              <Node kind="sink" w={108} h={36} title="The atlas" stroke={`${PM}8c`} />
              <Wire w={18} color={`${PM}8c`} />
              <Node kind="io" w={176} h={36} title="Claude Code · Codex" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: "11.5px", letterSpacing: "0.14em", color: DIM }}>
                STANDING JOBS
              </span>
              <span style={{ fontSize: "12px", color: "#8ba0bd", marginTop: "3px" }}>
                Quality check · Advertorial audit · Weekly report · Weekly backup
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: "12px",
          }}
        >
          <span style={{ fontSize: "15px", color: DIM }}>
            ai-atlas.app/methodology-and-agents
          </span>
          <span style={{ fontSize: "15px", color: DIM }}>
            Sourced by agents · published by a person
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
