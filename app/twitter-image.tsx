import { ImageResponse } from "next/og"
import { getAtlasStats } from "@/lib/data"

export const size = { width: 1200, height: 600 }
export const contentType = "image/png"
export const alt = "AI Atlas — Real-world AI deployments worldwide"

function fmt(n: number): string {
  return n.toLocaleString("en-US")
}

export default async function Image() {
  const { totalUseCases, totalCompanies, totalCountries } =
    await getAtlasStats()

  const logoUrl = "https://ai-atlas.app/ai-atlas-logo.png"

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          width: "100%",
          height: "100%",
          padding: "64px 80px",
          background:
            "linear-gradient(135deg, #0a1628 0%, #0d2137 35%, #0a1a2a 70%, #050d14 100%)",
          color: "#f5f5f5",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          letterSpacing: "-0.01em",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-160px",
            right: "-100px",
            width: "560px",
            height: "560px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(67,204,147,0.12) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            marginBottom: "36px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://ai-atlas.app/ai-atlas-logo.png"
            width="56"
            height="56"
            alt="AI Atlas"
            style={{ borderRadius: "12px" }}
          />
          <span
            style={{
              fontSize: "36px",
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
            maxWidth: "740px",
            lineHeight: 1.45,
            marginBottom: "52px",
          }}
        >
          Real-world AI deployments worldwide, updated daily.
        </p>

        <div
          style={{
            width: "160px",
            height: "3px",
            borderRadius: "2px",
            background:
              "linear-gradient(90deg, #43cc93 0%, rgba(67,204,147,0.2) 100%)",
            marginBottom: "40px",
          }}
        />

        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          {[
            { value: fmt(totalUseCases), label: "use cases" },
            { value: fmt(totalCompanies), label: "companies" },
            { value: fmt(totalCountries), label: "countries" },
          ].map(({ value, label }, i) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "baseline", gap: "8px" }}
            >
              <span
                style={{
                  fontSize: "42px",
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
            position: "absolute",
            bottom: "64px",
            right: "80px",
            fontSize: "15px",
            color: "#4a5b6a",
          }}
        >
          ai-atlas.app
        </div>
      </div>
    ),
    { ...size }
  )
}
