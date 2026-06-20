import { ImageResponse } from "next/og"
import { getAtlasStats } from "@/lib/data"
import { readFileSync } from "node:fs"
import { join } from "node:path"

export const size = { width: 1200, height: 600 }
export const contentType = "image/png"
export const alt = "AI Atlas — Real-world AI deployments worldwide"

function fmt(n: number): string {
  return n.toLocaleString("en-US")
}

const LOGO_URL = "https://ai-atlas.app/ai-atlas-logo.png"
const GLOBE_DATA_URL = (() => {
  try {
    const buf = readFileSync(join(process.cwd(), "public", "og-globe.png"))
    return `data:image/png;base64,${buf.toString("base64")}`
  } catch {
    return null
  }
})()

export default async function Image() {
  const { totalUseCases } = await getAtlasStats()
  const useCasesBucket = Math.floor(totalUseCases / 100) * 100

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #0a1628 0%, #0d2137 35%, #0a1a2a 70%, #050d14 100%)",
          color: "#f5f5f5",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          letterSpacing: "-0.01em",
          overflow: "hidden",
        }}
      >
        {/* LEFT: text content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "52px 24px 52px 56px",
            width: "700px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "24px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_URL}
              width={48}
              height={48}
              alt="AI Atlas"
              style={{ borderRadius: "11px" }}
            />
            <span
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#f5f5f5",
                letterSpacing: "-0.02em",
              }}
            >
              AI Atlas
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: "26px",
              color: "#f5f5f5",
              maxWidth: "560px",
              lineHeight: 1.25,
              fontWeight: 700,
              marginBottom: "28px",
              letterSpacing: "-0.02em",
            }}
          >
            Real-world AI deployments worldwide
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "32px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#43cc93",
                  display: "flex",
                }}
              />
              <span style={{ fontSize: "17px", color: "#d4dde5" }}>
                Daily noise-free news
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#43cc93",
                  display: "flex",
                }}
              />
              <span style={{ fontSize: "17px", color: "#d4dde5" }}>
                {fmt(useCasesBucket)}+ validated AI use cases
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#43cc93",
                  display: "flex",
                }}
              />
              <span style={{ fontSize: "17px", color: "#d4dde5" }}>
                Regular blog &amp; article updates
              </span>
            </div>
          </div>

          <div
            style={{
              width: "120px",
              height: "3px",
              borderRadius: "2px",
              background:
                "linear-gradient(90deg, #43cc93 0%, rgba(67,204,147,0.2) 100%)",
              marginBottom: "20px",
            }}
          />

          <span style={{ fontSize: "14px", color: "#6b7d8e" }}>
            Daily updates, read in 5 mins.
          </span>

          <div
            style={{
              display: "flex",
              marginTop: "auto",
              paddingTop: "28px",
            }}
          >
            <span style={{ fontSize: "14px", color: "#4a5b6a" }}>
              ai-atlas.app
            </span>
          </div>
        </div>

        {/* RIGHT: globe with tilt, no glow */}
        {GLOBE_DATA_URL && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "500px",
              flexShrink: 0,
              position: "relative",
              overflow: "visible",
              marginLeft: "-20px",
            }}
          >
            {/* Globe with tilt only (no glow, no drop-shadow) */}
            <div
              style={{
                display: "flex",
                position: "relative",
                width: "460px",
                height: "460px",
                borderRadius: "50%",
                overflow: "hidden",
                transform: "rotate(-15deg)",
                background: "transparent",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={GLOBE_DATA_URL}
                width={460}
                height={460}
                alt="AI Atlas globe"
                style={{
                  objectFit: "cover",
                  display: "flex",
                }}
              />
            </div>
          </div>
        )}
      </div>
    ),
    { ...size }
  )
}