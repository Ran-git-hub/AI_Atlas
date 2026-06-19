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
  const { totalUseCases, totalCompanies, totalCountries } =
    await getAtlasStats()

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
              fontSize: "26px",
              color: "#a0aab4",
              maxWidth: "560px",
              lineHeight: 1.4,
              marginBottom: "40px",
            }}
          >
            Real-world AI deployments worldwide, updated daily.
          </p>

          <div
            style={{
              width: "140px",
              height: "3px",
              borderRadius: "2px",
              background:
                "linear-gradient(90deg, #43cc93 0%, rgba(67,204,147,0.2) 100%)",
              marginBottom: "32px",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {[
              { value: fmt(totalUseCases), label: "use cases" },
              { value: fmt(totalCompanies), label: "companies" },
              { value: fmt(totalCountries), label: "countries" },
            ].map(({ value, label }, i) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "40px",
                    fontWeight: 800,
                    color: "#43cc93",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {value}
                </span>
                <span style={{ fontSize: "18px", color: "#6b7d8e" }}>
                  {label}
                </span>
                {i < 2 ? (
                  <span
                    style={{
                      fontSize: "24px",
                      color: "#2a3a4a",
                      margin: "0 6px",
                      fontWeight: 300,
                    }}
                  >
                    ·
                  </span>
                ) : null}
              </div>
            ))}
          </div>

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

        {/* RIGHT: globe screenshot */}
        {GLOBE_DATA_URL && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "540px",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={GLOBE_DATA_URL}
              width={540}
              height={540}
              alt="AI Atlas globe"
              style={{ objectFit: "contain" }}
            />
          </div>
        )}
      </div>
    ),
    { ...size }
  )
}