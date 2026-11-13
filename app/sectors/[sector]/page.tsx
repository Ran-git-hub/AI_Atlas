import Link from "next/link"
import { notFound } from "next/navigation"
import { getCachedLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import { getSectorDetail } from "@/lib/data-industries"
import { AtlasAppTopRow } from "@/components/atlas-app-top-row"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"
import { IndustryBreakdownList } from "@/components/industries/industry-breakdown-list"
import { IndustryStats } from "@/components/industries/industry-stats"
import { IndustryUseCaseCard } from "@/components/industries/industry-use-case-card"
import { UseCaseLinkIndex } from "@/components/use-cases/use-case-link-index"
import { hubMetaDescription, pageMetadata } from "@/lib/page-metadata"
import { breadcrumbSchema, jsonLdProps } from "@/lib/structured-data"
import { formatAtlasDate } from "@/lib/format-date"

const sectorsShellPad =
  "mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]"

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return formatAtlasDate(date)
}

type Params = {
  sector: string
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { sector } = await params
  const detail = await getSectorDetail(sector)

  if (!detail) {
    return {
      title: "Sector Not Found — AI Atlas",
    }
  }

  return pageMetadata({
    title: `AI Use Cases in ${detail.name} — AI Atlas`,
    description: hubMetaDescription({
      place: detail.name,
      useCaseCount: detail.useCaseCount,
      organizations: detail.topCompanies.map((item) => item.name),
      span: detail.countryCount === 1 ? "1 country/region" : `${detail.countryCount} countries/regions`,
    }),
    path: `/sectors/${encodeURIComponent(detail.slug)}`,
  })
}

export default async function SectorDetailPage({ params }: { params: Promise<Params> }) {
  const { sector } = await params
  const [detail, latestDataUpdateCet] = await Promise.all([
    getSectorDetail(sector),
    getCachedLatestAtlasDataUpdateCetDisplay(),
  ])

  if (!detail) {
    notFound()
  }

  const latestUpdated = formatDate(detail.latestUpdatedAt)

  return (
    <main className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]" style={{ colorScheme: "dark" }}>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        {...jsonLdProps(
          breadcrumbSchema([
            { name: "AI Atlas", path: "/" },
            { name: "Industries", path: "/industries" },
            { name: detail.name, path: `/sectors/${encodeURIComponent(detail.slug)}` },
          ]),
        )}
      />
      <div className="border-b border-slate-800 bg-[#121212]">
        <div className={sectorsShellPad}>
          <AtlasAppTopRow activeView="industries" />
          <div className="mt-4 w-full min-w-0 border-t border-slate-800/80 pt-5">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Link
                href="/industries"
                className="inline-flex items-center gap-2 rounded-md border border-[#43cc93]/35 bg-[#43cc93]/10 px-3.5 py-1.5 text-sm font-medium text-[#43cc93] transition-colors hover:border-[#43cc93]/60 hover:bg-[#43cc93]/15 hover:text-[#7ee2b5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43cc93]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]"
              >
                ← All industries
              </Link>
            </div>
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-[#43cc93]">
              Sector
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
            { label: "Countries/Regions", value: detail.countryCount },
            { label: "Latest Update", value: latestUpdated },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <IndustryBreakdownList title="Industries" items={detail.industries} />
          <IndustryBreakdownList title="Top Countries/Regions" items={detail.relatedCountries} />
          <IndustryBreakdownList title="Top Organizations" items={detail.topCompanies} />
        </div>

        <section className="rounded-xl border border-slate-800 bg-[#1a1a1a] p-5">
          <h2 className="text-xl font-semibold text-[#f5f5f5]">Recent Use Cases</h2>
          <p className="mt-1 text-sm text-slate-400">
            Latest examples from this sector.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {detail.recentUseCases.map((useCase) => (
              <IndustryUseCaseCard key={useCase.id} useCase={useCase} />
            ))}
          </div>
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
