import { ImageResponse } from "next/og"
import { getAtlasStats } from "@/lib/data"
import { readFileSync } from "node:fs"
import { join } from "node:path"

export const size = { width: 1200, height: 630 }
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
            padding: "64px 48px 64px 72px",
            width: "660px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_URL}
              width={56}
              height={56}
              alt="AI Atlas"
              style={{ borderRadius: "12px" }}
            />
            <span
              style={{
                fontSize: "32px",
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
              fontSize: "30px",
              color: "#f5f5f5",
              maxWidth: "580px",
              lineHeight: 1.25,
              fontWeight: 700,
              marginBottom: "36px",
              letterSpacing: "-0.02em",
            }}
          >
            Real-world AI deployments worldwide
          </p>

          {/* Three bullets stacked vertically — cleaner than inline dots */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              marginBottom: "40px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#43cc93",
                  display: "flex",
                }}
              />
              <span style={{ fontSize: "20px", color: "#d4dde5" }}>
                Daily noise-free news
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#43cc93",
                  display: "flex",
                }}
              />
              <span style={{ fontSize: "20px", color: "#d4dde5" }}>
                {fmt(useCasesBucket)}+ validated AI use cases
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#43cc93",
                  display: "flex",
                }}
              />
              <span style={{ fontSize: "20px", color: "#d4dde5" }}>
                Regular blog &amp; article updates
              </span>
            </div>
          </div>

          <div
            style={{
              width: "140px",
              height: "3px",
              borderRadius: "2px",
              background:
                "linear-gradient(90deg, #43cc93 0%, rgba(67,204,147,0.2) 100%)",
              marginBottom: "28px",
            }}
          />

          <span style={{ fontSize: "15px", color: "#6b7d8e" }}>
            Every use case verified · Updated daily · Read in 2 min
          </span>

          <div
            style={{
              display: "flex",
              marginTop: "auto",
              paddingTop: "40px",
            }}
          >
            <span style={{ fontSize: "15px", color: "#4a5b6a" }}>
              ai-atlas.app
            </span>
          </div>
        </div>

        {/* RIGHT: globe with glow + tilt */}
        {GLOBE_DATA_URL && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "540px",
              flexShrink: 0,
              position: "relative",
            }}
          >
            {/* Radial glow */}
            <div
              style={{
                position: "absolute",
                width: "620px",
                height: "620px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(67,204,147,0.30) 0%, rgba(67,204,147,0.10) 35%, transparent 70%)",
                filter: "blur(30px)",
                display: "flex",
              }}
            />
            {/* Globe with tilt + drop shadow */}
            <div
              style={{
                display: "flex",
                position: "relative",
                width: "520px",
                height: "520px",
                borderRadius: "50%",
                overflow: "hidden",
                transform: "rotate(-12deg) rotateX(10deg)",
                filter: "drop-shadow(0 0 50px rgba(67,204,147,0.35))",
                background: "transparent",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={GLOBE_DATA_URL}
                width={520}
                height={520}
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