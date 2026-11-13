import type { CSSProperties } from "react"
import { getCachedLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import { getCachedIndustrySummaries, groupIndustriesBySector } from "@/lib/data-industries"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"
import { HubHeading } from "@/components/industries/hub-heading"
import { HubHero } from "@/components/industries/hub-hero"
import { SectorPanel } from "@/components/industries/sector-panel"
import { SectorTreemap } from "@/components/industries/sector-treemap"
import { pageMetadata } from "@/lib/page-metadata"

const bodyPad =
  "mx-auto max-w-7xl px-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]"

export const metadata = pageMetadata({
  title: "AI Use Cases By Industry — AI Atlas",
  description: "Explore real-world AI deployments by industry across organizations and countries/regions.",
  path: "/industries",
})

export default async function IndustriesPage() {
  const [industries, latestDataUpdateCet] = await Promise.all([
    getCachedIndustrySummaries(),
    getCachedLatestAtlasDataUpdateCetDisplay(),
  ])

  const groups = groupIndustriesBySector(industries)
  const totalUseCases = industries.reduce((sum, industry) => sum + industry.useCaseCount, 0)
  const totalCompanies = industries.reduce((sum, industry) => sum + industry.companyCount, 0)

  return (
    <main className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]" style={{ colorScheme: "dark" }}>
      <HubHero
        accent="#43cc93"
        crumbs={[{ name: "AI Atlas", href: "/" }, { name: "Industries" }]}
        eyebrow={["Industry Explorer"]}
        titleLead="AI Use Cases"
        titleAccent="By Industry"
        stats={[
          { label: "Use Cases", value: totalUseCases },
          { label: "Sectors", value: groups.filter((group) => group.slug).length },
          { label: "Industries", value: industries.length },
          { label: "Organization Appearances", value: totalCompanies },
        ]}
      >
        <p>
          Browse real-world AI deployments by industry, then jump into the full use case index for deeper filtering and source-level exploration.
        </p>
      </HubHero>

      {industries.length > 0 ? (
        <div className={`${bodyPad} hub-sharp space-y-8 py-8`} style={{ "--accent": "#43cc93" } as CSSProperties}>
          <section className="hidden lg:block">
            <HubHeading aside="Tile size = use cases">Sector map</HubHeading>
            <div className="mt-4">
              <SectorTreemap groups={groups} />
            </div>
          </section>

          <div className="gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
            {groups.map((group) => (
              <SectorPanel key={group.name} group={group} />
            ))}
          </div>
        </div>
      ) : (
        <div className={`${bodyPad} py-8`}>
          <div className="rounded-xl border border-slate-800 bg-[#1a1a1a] px-5 py-12 text-center">
            <h2 className="text-xl font-semibold text-[#f5f5f5]">No industries yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Industry pages will appear once use cases include industry metadata.
            </p>
          </div>
        </div>
      )}

      <div className={`${bodyPad} mt-8 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]`}>
        <AtlasSiteFooter latestDataUpdateCet={latestDataUpdateCet} layout="inline" />
      </div>
    </main>
  )
}
