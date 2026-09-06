import Link from "next/link"
import { notFound } from "next/navigation"
import { getCachedLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import { getCountryDetail } from "@/lib/data-countries"
import { AtlasAppTopRow } from "@/components/atlas-app-top-row"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"
import { IndustryBreakdownList } from "@/components/industries/industry-breakdown-list"
import { IndustryStats } from "@/components/industries/industry-stats"
import { IndustryUseCaseCard } from "@/components/industries/industry-use-case-card"
import { UseCaseLinkIndex } from "@/components/use-cases/use-case-link-index"
import { pageMetadata } from "@/lib/page-metadata"
import { formatAtlasDate } from "@/lib/format-date"

const countriesShellPad =
  "mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]"

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return formatAtlasDate(date)
}

type Params = {
  country: string
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { country } = await params
  const detail = await getCountryDetail(country)

  if (!detail) {
    return {
      title: "Country Not Found — AI Atlas",
    }
  }

  return pageMetadata({
    title: `AI Use Cases in ${detail.name} — AI Atlas`,
    description: `Explore real-world AI deployments in ${detail.name} across organizations and industries.`,
    path: `/countries/${encodeURIComponent(detail.slug)}`,
  })
}

export default async function CountryDetailPage({ params }: { params: Promise<Params> }) {
  const { country } = await params
  const [detail, latestDataUpdateCet] = await Promise.all([
    getCountryDetail(country),
    getCachedLatestAtlasDataUpdateCetDisplay(),
  ])

  if (!detail) {
    notFound()
  }

  const latestUpdated = formatDate(detail.latestUpdatedAt)

  return (
    <main className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]" style={{ colorScheme: "dark" }}>
      <div className="border-b border-slate-800 bg-[#121212]">
        <div className={countriesShellPad}>
          <AtlasAppTopRow activeView="countries" />
          <div className="mt-4 w-full min-w-0 border-t border-slate-800/80 pt-5">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Link
                href="/countries"
                className="inline-flex items-center gap-2 rounded-md border border-[#43cc93]/35 bg-[#43cc93]/10 px-3.5 py-1.5 text-sm font-medium text-[#43cc93] transition-colors hover:border-[#43cc93]/60 hover:bg-[#43cc93]/15 hover:text-[#7ee2b5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43cc93]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]"
              >
                ← All countries/regions
              </Link>
            </div>
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-[#43cc93]">
              Country/Region
            </p>
            <h1 className="mb-3 text-3xl font-bold leading-tight text-[#f5f5f5] md:text-4xl">
              AI in {detail.name}
            </h1>
            <p className="text-pretty text-base leading-relaxed text-slate-300">
              {detail.summary}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        <IndustryStats
          items={[
            { label: "Use Cases", value: detail.useCaseCount },
            { label: "Organizations", value: detail.companyCount },
            { label: "Industries", value: detail.industryCount },
            { label: "Latest Update", value: latestUpdated },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <IndustryBreakdownList title="Top Industries" items={detail.relatedIndustries} />
          <IndustryBreakdownList title="Top Organizations" items={detail.topCompanies} />
        </div>

        <section className="rounded-xl border border-slate-800 bg-[#1a1a1a] p-5">
          <h2 className="text-xl font-semibold text-[#f5f5f5]">Recent Use Cases</h2>
          <p className="mt-1 text-sm text-slate-400">
            Latest examples from this country/region.
          </p>

          {detail.recentUseCases.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {detail.recentUseCases.map((useCase) => (
                <IndustryUseCaseCard key={useCase.id} useCase={useCase} />
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-slate-800 bg-[#121212] px-4 py-6 text-center text-sm text-slate-500">
              No recent use cases available for this country/region yet.
            </p>
          )}
        </section>

        <UseCaseLinkIndex
          rows={detail.allUseCases}
          title={`All ${detail.name} use cases`}
          description={`Every ${detail.name} deployment tracked in the catalog, A-Z.`}
        />
      </div>

      <div className="mx-auto mt-8 max-w-7xl px-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        <AtlasSiteFooter latestDataUpdateCet={latestDataUpdateCet} layout="inline" />
      </div>
    </main>
  )
}
