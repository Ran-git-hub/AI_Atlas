import { getCachedLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import { AtlasAppTopRow } from "@/components/atlas-app-top-row"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"
import { MethodologyBody } from "@/components/methodology/methodology-body"
import { pageMetadata } from "@/lib/page-metadata"

const shellPad =
  "mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]"

export const metadata = pageMetadata({
  title: "Methodology & Agents — AI Atlas",
  description:
    "How AI Atlas collects and verifies real-world AI deployments: an autonomous agent running nightly, the rules it is held to, and the review every record passes before it is published.",
  path: "/methodology-and-agents",
  // A written piece, not a landing page. LinkedIn's rich link card is built by
  // an "articleshare" pipeline that wants a type and a date; without them the
  // page resolves to the minimal card and its share image is served as a
  // thumbnail. Google reads the same dates for article rich results.
  type: "article",
  publishedTime: "2026-09-14T00:00:00.000Z",
  modifiedTime: "2026-09-15T00:00:00.000Z",
})

/**
 * No `activeView` on the top row: this page is deliberately not in the view
 * switcher, which is reached from the footer instead.
 */
export default async function MethodologyPage() {
  const latestDataUpdateCet = await getCachedLatestAtlasDataUpdateCetDisplay()

  return (
    <main className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]" style={{ colorScheme: "dark" }}>
      <div id="atlas-chrome" className="sticky top-0 z-50 border-b border-slate-800 bg-[#121212]">
        <div className={shellPad}>
          <AtlasAppTopRow />
        </div>
      </div>

      <MethodologyBody />

      <div className="mx-auto max-w-7xl px-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        <AtlasSiteFooter latestDataUpdateCet={latestDataUpdateCet} layout="inline" />
      </div>
    </main>
  )
}
