import { readFileSync } from "node:fs"
import { join } from "node:path"

// Shared artwork for the site-level social cards. `app/opengraph-image.tsx`
// (1200x630, what LinkedIn and Facebook read) and `app/twitter-image.tsx`
// (1200x600) differ only in height, so the layout lives here once.

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

// Pinned by hand rather than read from Supabase. The live published count is
// 697 (2026-09-14) and a nearest-50 rounding would claim 700+ a few days early.
// Once the catalog is genuinely past 700, restore the query:
//   const { totalUseCases } = await getAtlasStats()
//   const bucket = Math.floor(totalUseCases / 50) * 50
const USE_CASE_COUNT_LABEL = "700+"

const WIDTH = 1200
// Absolute children are laid out against the padding box, so card coordinates
// have to be shifted back by the card's own padding.
const PAD_X = 58
const PAD_Y = 42

// The sphere is drawn far larger than the card and bleeds off the top, right
// and bottom, so only its limb and the European deployment cluster are in
// frame. The limb deliberately runs behind the headline; a soft left-to-right
// scrim is all that is needed to keep the copy readable over it.
const GLOBE_SIZE = 1150
const GLOBE_LEFT = 300
// Sits 20px below the card's centre, which puts the European cluster just under
// the headline instead of behind it.
const globeTop = (height: number) => height / 2 + 20 - GLOBE_SIZE / 2

function Pillar({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
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
      <span style={{ fontSize: "23px", color: "#d4dde5", letterSpacing: "-0.01em" }}>
        {text}
      </span>
    </div>
  )
}

export function OgSiteCard({ height }: { height: number }) {
  return (
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
        padding: `${PAD_Y}px ${PAD_X}px`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {GLOBE_DATA_URL && (
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: `${GLOBE_LEFT - PAD_X}px`,
            top: `${globeTop(height) - PAD_Y}px`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={GLOBE_DATA_URL}
            width={GLOBE_SIZE}
            height={GLOBE_SIZE}
            alt=""
            style={{ display: "flex" }}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          position: "absolute",
          left: `${-PAD_X}px`,
          top: `${-PAD_Y}px`,
          width: `${WIDTH}px`,
          height: `${height + PAD_Y * 2}px`,
          background:
            "linear-gradient(90deg, rgba(5,13,20,0.7) 0%, rgba(5,13,20,0.55) 28%, rgba(5,13,20,0.22) 52%, rgba(5,13,20,0) 70%)",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_URL}
          width={62}
          height={62}
          alt="AI Atlas"
          style={{ borderRadius: "14px" }}
        />
        <span style={{ fontSize: "35px", fontWeight: 700, letterSpacing: "-0.02em" }}>
          AI Atlas
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
        }}
      >
        {/* Two explicit lines rather than a wrapped paragraph, so the break
            always falls after "Real-world" whatever the rendering width. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: "76px",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
          }}
        >
          <span style={{ whiteSpace: "nowrap" }}>Real-world</span>
          <span style={{ whiteSpace: "nowrap" }}>AI deployments worldwide</span>
        </div>

        <div
          style={{
            display: "flex",
            width: "150px",
            height: "4px",
            borderRadius: "2px",
            background:
              "linear-gradient(90deg, #43cc93 0%, rgba(67,204,147,0.15) 100%)",
            marginTop: "20px",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            rowGap: "12px",
            marginTop: "22px",
          }}
        >
          <Pillar text={`${USE_CASE_COUNT_LABEL} validated AI use cases`} />
          <Pillar text="Daily AI news, de-noised" />
          <Pillar text="Industry explorer & reports" />
          <Pillar text="Insights worth knowing" />
        </div>
      </div>

      {/* Both footer lines sit left: the right edge of the card is now the
          brightest part of the globe, where small grey type disappears. */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "18px", color: "#6b7d8e" }}>ai-atlas.app</span>
        <span style={{ fontSize: "18px", color: "#33414f" }}>|</span>
        <span style={{ fontSize: "18px", color: "#4a5b6a" }}>
          Curated daily · read in 5 minutes
        </span>
      </div>
    </div>
  )
}
