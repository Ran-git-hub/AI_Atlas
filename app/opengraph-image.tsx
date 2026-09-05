import { ImageResponse } from "next/og"
import { getAtlasStats } from "@/lib/data"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Supabase reads go through fetch, which Next's Data Cache persists across
// builds — without this the card keeps rendering counts from whenever it was
// first prerendered.
export const revalidate = 3600

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "AI Atlas — Real-world AI deployments worldwide"

function fmt(n: number): string {
  return n.toLocaleString("en-US")
}

const LOGO_URL = "https://ai-atlas.app/ai-atlas-logo.png"
// Transparent sphere: the original og-globe.png bakes the site background into
// its corners, which shows as a rectangle once it overlaps the card gradient.
const GLOBE_DATA_URL = (() => {
  try {
    const buf = readFileSync(join(process.cwd(), "public", "og-globe-alpha.png"))
    return `data:image/png;base64,${buf.toString("base64")}`
  } catch {
    return null
  }
})()

function Pillar({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "440px" }}>
      <div
        style={{
          display: "flex",
          width: "9px",
          height: "9px",
          borderRadius: "50%",
          background: "#43cc93",
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "25px", color: "#d4dde5", letterSpacing: "-0.01em" }}>
        {text}
      </span>
    </div>
  )
}

export default async function Image() {
  const { totalUseCases } = await getAtlasStats()
  // Rounded down, never exact: this card is regenerated at most hourly and then
  // cached by each social network for days, so a precise count would be wrong
  // far more often than it's right.
  const useCasesBucket = Math.floor(totalUseCases / 50) * 50

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
          padding: "64px 72px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {GLOBE_DATA_URL && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              right: "-170px",
              bottom: "-190px",
              opacity: 0.3,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={GLOBE_DATA_URL}
              width={580}
              height={580}
              alt=""
              style={{ display: "flex" }}
            />
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_URL}
            width={48}
            height={48}
            alt="AI Atlas"
            style={{ borderRadius: "10px" }}
          />
          <span style={{ fontSize: "27px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            AI Atlas
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
              fontSize: "64px",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              maxWidth: "760px",
            }}
          >
            Real-world AI deployments worldwide
          </p>

          <div
            style={{
              display: "flex",
              width: "150px",
              height: "4px",
              borderRadius: "2px",
              background:
                "linear-gradient(90deg, #43cc93 0%, rgba(67,204,147,0.15) 100%)",
              marginTop: "34px",
            }}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              rowGap: "20px",
              columnGap: "24px",
              marginTop: "36px",
              maxWidth: "920px",
            }}
          >
            <Pillar text={`${fmt(useCasesBucket)}+ validated AI use cases`} />
            <Pillar text="Daily AI news, de-noised" />
            <Pillar text="Industry explorer & reports" />
            <Pillar text="Weekly insights from the catalog" />
          </div>
        </div>

        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span style={{ fontSize: "18px", color: "#6b7d8e" }}>ai-atlas.app</span>
          <span style={{ fontSize: "18px", color: "#4a5b6a" }}>
            Curated daily · read in 5 minutes
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
