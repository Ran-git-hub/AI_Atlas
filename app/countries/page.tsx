import { getCachedLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import { getCachedCountrySummaries } from "@/lib/data-countries"
import { AtlasAppTopRow } from "@/components/atlas-app-top-row"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"
import { CountrySummaryCard } from "@/components/countries/country-summary-card"
import { pageMetadata } from "@/lib/page-metadata"

const countriesShellPad =
  "mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]"

export const metadata = pageMetadata({
  title: "AI Use Cases By Country — AI Atlas",
  description:
    "Explore real-world AI deployments by country and region across organizations and industries.",
  path: "/countries",
})

export default async function CountriesPage() {
  const [countries, latestDataUpdateCet] = await Promise.all([
    getCachedCountrySummaries(),
    getCachedLatestAtlasDataUpdateCetDisplay(),
  ])

  const totalUseCases = countries.reduce((sum, country) => sum + country.useCaseCount, 0)

  return (
    <main className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]" style={{ colorScheme: "dark" }}>
      <div className="border-b border-slate-800 bg-[#121212]">
        <div className={countriesShellPad}>
          <AtlasAppTopRow activeView="countries" />
          <div className="mt-4 w-full min-w-0 border-t border-slate-800/80 pt-5">
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-cyan-400">
              Country Explorer
            </p>
            <h1 className="mb-3 text-3xl font-bold leading-tight text-[#f5f5f5] md:text-4xl">
              AI Use Cases By Country
            </h1>
            <p className="text-pretty text-base leading-relaxed text-slate-400">
              Browse real-world AI deployments by country and region, then open a country to see
              every tracked case.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-300">
              <span className="rounded-full border border-slate-800 bg-[#1a1a1a] px-3 py-1.5">
                {countries.length.toLocaleString()} countries/regions
              </span>
              <span className="rounded-full border border-slate-800 bg-[#1a1a1a] px-3 py-1.5">
                {totalUseCases.toLocaleString()} use cases
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-5 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        {countries.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {countries.map((country) => (
              <CountrySummaryCard key={country.slug} country={country} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-[#1a1a1a] px-5 py-12 text-center">
            <h2 className="text-xl font-semibold text-[#f5f5f5]">No countries yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Country pages will appear once use cases include country metadata.
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
