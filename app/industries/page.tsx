import { getLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import { getIndustrySummaries } from "@/lib/data-industries"
import { AtlasAppTopRow } from "@/components/atlas-app-top-row"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"
import { IndustrySummaryCard } from "@/components/industries/industry-summary-card"
const industriesShellPad =
  "mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]"

export const metadata = {
  title: "AI Use Cases By Industry — AI Atlas",
  description: "Explore real-world AI deployments by industry across companies/organizations and countries/regions.",
}

export default async function IndustriesPage() {
  const [industries, latestDataUpdateCet] = await Promise.all([
    getIndustrySummaries(),
    getLatestAtlasDataUpdateCetDisplay(),
  ])

  const totalUseCases = industries.reduce((sum, industry) => sum + industry.useCaseCount, 0)
  const totalCompanies = industries.reduce((sum, industry) => sum + industry.companyCount, 0)

  return (
    <main className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]" style={{ colorScheme: "dark" }}>
      <div className="border-b border-slate-800 bg-[#121212]">
        <div className={industriesShellPad}>
          <AtlasAppTopRow activeView="industries" />
          <div className="mt-4 w-full min-w-0 border-t border-slate-800/80 pt-5">
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-cyan-400">
              Industry Explorer
            </p>
            <h1 className="mb-3 text-3xl font-bold leading-tight text-[#f5f5f5] md:text-4xl">
              AI Use Cases By Industry
            </h1>
            <p className="text-pretty text-base leading-relaxed text-slate-400">
              Browse real-world AI deployments by industry, then jump into the full use case index for deeper filtering and source-level exploration.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-300">
              <span className="rounded-full border border-slate-800 bg-[#1a1a1a] px-3 py-1.5">
                {industries.length.toLocaleString()} industries
              </span>
              <span className="rounded-full border border-slate-800 bg-[#1a1a1a] px-3 py-1.5">
                {totalUseCases.toLocaleString()} use cases
              </span>
              <span className="rounded-full border border-slate-800 bg-[#1a1a1a] px-3 py-1.5">
                {totalCompanies.toLocaleString()} company/organization appearances
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-5 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        {industries.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {industries.map((industry) => (
              <IndustrySummaryCard key={industry.slug} industry={industry} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-[#1a1a1a] px-5 py-12 text-center">
            <h2 className="text-xl font-semibold text-[#f5f5f5]">No industries yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Industry pages will appear once use cases include industry metadata.
            </p>
          </div>
        )}
      </div>

      <div className="mx-auto mt-8 max-w-7xl px-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        <AtlasSiteFooter latestDataUpdateCet={latestDataUpdateCet} layout="inline" />
      </div>
    </main>
  )
}
