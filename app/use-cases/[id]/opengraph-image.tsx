import { ImageResponse } from "next/og"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { getUseCaseOgSummary } from "@/lib/data"

// Supabase reads go through fetch, which Next's Data Cache persists across
// builds — without this the card keeps showing the title and company from
// whenever it was first rendered, even after the record is edited.
export const revalidate = 3600

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "AI use case on AI Atlas"

const LOGO_URL = "https://ai-atlas.app/ai-atlas-logo.png"
// og-globe-alpha.png is the sphere with a real transparent surround. The
// original og-globe.png is fully opaque with its corners baked to the site
// background, and Satori doesn't reliably clip it to a circle — the square
// showed through as a lighter rectangle over the card gradient.
const GLOBE_DATA_URL = (() => {
  try {
    const buf = readFileSync(join(process.cwd(), "public", "og-globe-alpha.png"))
    return `data:image/png;base64,${buf.toString("base64")}`
  } catch {
    return null
  }
})()

/** Satori has no line-clamp, so long titles are trimmed on a word boundary. */
function clampTitle(value: string, max: number): string {
  if (value.length <= max) return value
  const cut = value.slice(0, max)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

function titleFontSize(length: number): number {
  if (length <= 55) return 62
  if (length <= 90) return 52
  return 44
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const summary = await getUseCaseOgSummary(id)

  const title = clampTitle(summary?.title || "AI use case", 130)
  const meta = [summary?.companyName, summary?.industry, summary?.location]
    .filter(Boolean)
    .join("  ·  ")

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #0a1628 0%, #0d2137 35%, #0a1a2a 70%, #050d14 100%)",
          color: "#f5f5f5",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          letterSpacing: "-0.01em",
          padding: "42px 58px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {GLOBE_DATA_URL && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              right: "-150px",
              bottom: "-170px",
              opacity: 0.28,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={GLOBE_DATA_URL}
              width={520}
              height={520}
              alt=""
              style={{ display: "flex" }}
            />
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_URL}
            width={44}
            height={44}
            alt="AI Atlas"
            style={{ borderRadius: "10px" }}
          />
          <span style={{ fontSize: "25px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            AI Atlas
          </span>
          <span
            style={{
              marginLeft: "10px",
              fontSize: "16px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              color: "#43cc93",
            }}
          >
            AI USE CASE
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            paddingRight: "40px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: `${titleFontSize(title.length)}px`,
              fontWeight: 700,
              lineHeight: 1.16,
              letterSpacing: "-0.025em",
              color: "#f5f5f5",
            }}
          >
            {title}
          </p>

          <div
            style={{
              display: "flex",
              width: "150px",
              height: "4px",
              borderRadius: "2px",
              background:
                "linear-gradient(90deg, #43cc93 0%, rgba(67,204,147,0.15) 100%)",
              marginTop: "22px",
            }}
          />

          {meta ? (
            <p
              style={{
                margin: 0,
                marginTop: "22px",
                fontSize: "25px",
                lineHeight: 1.3,
                color: "#d4dde5",
              }}
            >
              {meta}
            </p>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "18px", color: "#6b7d8e" }}>ai-atlas.app</span>
          <span style={{ fontSize: "18px", color: "#4a5b6a" }}>
            Real-world AI deployments worldwide
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
