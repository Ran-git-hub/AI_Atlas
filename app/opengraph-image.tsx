import { ImageResponse } from "next/og"
import { getAtlasStats } from "@/lib/data"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "AI Atlas — Real-world AI deployments worldwide"

// Number formatting helper — compact for thousands
function fmt(n: number): string {
  return n.toLocaleString("en-US")
}

export default async function Image() {
  const { totalUseCases, totalCompanies, totalCountries } =
    await getAtlasStats()

  const statsLine = `${fmt(totalUseCases)} use cases · ${fmt(totalCompanies)} companies · ${fmt(totalCountries)} countries`

  // Use production URL so the logo resolves in both local dev and
  // deployed environments. The image is publicly accessible at the
  // canonical domain.
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
          padding: "72px 88px",
          background:
            "linear-gradient(135deg, #0a1628 0%, #0d2137 35%, #0a1a2a 70%, #050d14 100%)",
          color: "#f5f5f5",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          letterSpacing: "-0.01em",
        }}
      >
        {/* Subtle radial glow */}
        <div
          style={{
            position: "absolute",
            top: "-180px",
            right: "-120px",
            width: "620px",
            height: "620px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(67,204,147,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            width="64"
            height="64"
            alt="AI Atlas"
            style={{ borderRadius: "14px" }}
          />
          <span
            style={{
              fontSize: "40px",
              fontWeight: 700,
              color: "#f5f5f5",
              letterSpacing: "-0.02em",
            }}
          >
            AI Atlas
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            margin: 0,
            fontSize: "28px",
            color: "#a0aab4",
            maxWidth: "800px",
            lineHeight: 1.45,
            marginBottom: "56px",
          }}
        >
          Real-world AI deployments worldwide, updated daily.
        </p>

        {/* Divider */}
        <div
          style={{
            width: "180px",
            height: "3px",
            borderRadius: "2px",
            background:
              "linear-gradient(90deg, #43cc93 0%, rgba(67,204,147,0.2) 100%)",
            marginBottom: "44px",
          }}
        />

        {/* Stats line */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          {[
            { value: fmt(totalUseCases), label: "use cases" },
            { value: fmt(totalCompanies), label: "companies" },
            { value: fmt(totalCountries), label: "countries" },
          ].map(({ value, label }, i) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "baseline", gap: "10px" }}
            >
              <span
                style={{
                  fontSize: "46px",
                  fontWeight: 800,
                  color: "#43cc93",
                  letterSpacing: "-0.02em",
                }}
              >
                {value}
              </span>
              <span style={{ fontSize: "20px", color: "#6b7d8e" }}>
                {label}
              </span>
              {i < 2 ? (
                <span
                  style={{
                    fontSize: "28px",
                    color: "#2a3a4a",
                    margin: "0 8px",
                    fontWeight: 300,
                  }}
                >
                  ·
                </span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "72px",
            right: "88px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "16px", color: "#4a5b6a" }}>
            ai-atlas.app
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
