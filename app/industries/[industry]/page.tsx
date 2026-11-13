import Link from "next/link"
import { notFound } from "next/navigation"
import type { CSSProperties } from "react"
import { getCachedLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import {
  getCachedIndustrySummaries,
  getIndustryDetail,
  getSectorForIndustry,
  groupIndustriesBySector,
} from "@/lib/data-industries"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"
import { HubBarList } from "@/components/industries/hub-bar-list"
import { HubHeading } from "@/components/industries/hub-heading"
import { HubHero } from "@/components/industries/hub-hero"
import { IndustryRelatedReports } from "@/components/industries/industry-related-reports"
import { IndustryUseCaseCard } from "@/components/industries/industry-use-case-card"
import { SectorNav } from "@/components/industries/sector-nav"
import { UseCaseLinkIndex } from "@/components/use-cases/use-case-link-index"
import { DEFAULT_SECTOR_ACCENT, getIndustrySearchName } from "@/lib/industry-metadata"
import { hubMetaDescription, pageMetadata } from "@/lib/page-metadata"
import { breadcrumbSchema, jsonLdProps } from "@/lib/structured-data"
import { formatAtlasDate } from "@/lib/format-date"
const bodyPad =
  "mx-auto max-w-7xl px-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]"

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return formatAtlasDate(date)
}

type Params = {
  industry: string
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { industry } = await params
  const detail = await getIndustryDetail(industry)

  if (!detail) {
    return {
      title: "Industry Not Found — AI Atlas",
    }
  }

  const searchName = getIndustrySearchName(detail.slug, detail.name)

  return pageMetadata({
    title: `AI Use Cases in ${searchName} — AI Atlas`,
    description: hubMetaDescription({
      place: searchName,
      useCaseCount: detail.useCaseCount,
      organizations: detail.topCompanies.map((item) => item.name),
      span: detail.countryCount === 1 ? "1 country/region" : `${detail.countryCount} countries/regions`,
    }),
    path: `/industries/${encodeURIComponent(detail.slug)}`,
  })
}

export default async function IndustryDetailPage({ params }: { params: Promise<Params> }) {
  const { industry } = await params
  const [detail, industries, latestDataUpdateCet] = await Promise.all([
    getIndustryDetail(industry),
    getCachedIndustrySummaries(),
    getCachedLatestAtlasDataUpdateCetDisplay(),
  ])

  if (!detail) {
    notFound()
  }

  const useCasesHref = `/use-cases?industry=${encodeURIComponent(detail.name)}`
  const sector = getSectorForIndustry(detail.name)
  const accent = sector?.accent ?? DEFAULT_SECTOR_ACCENT
  const groups = groupIndustriesBySector(industries)
  const siblings = (groups.find((group) => group.slug && group.slug === sector?.slug)?.industries ?? [])
    .filter((item) => item.slug !== detail.slug)
    .map((item) => ({ name: item.name, count: item.useCaseCount, href: `/industries/${item.slug}` }))

  return (
    <main className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]" style={{ colorScheme: "dark" }}>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        {...jsonLdProps(
          breadcrumbSchema([
            { name: "AI Atlas", path: "/" },
            { name: "Industries", path: "/industries" },
            ...(sector ? [{ name: sector.name, path: `/sectors/${sector.slug}` }] : []),
            { name: detail.name, path: `/industries/${encodeURIComponent(detail.slug)}` },
          ]),
        )}
      />
      <HubHero
        accent={accent}
        crumbs={[
          { name: "AI Atlas", href: "/" },
          { name: "Industries", href: "/industries" },
          ...(sector ? [{ name: sector.name, href: `/sectors/${sector.slug}` }] : []),
          { name: detail.name },
        ]}
        eyebrow={sector ? ["Industry", sector.name] : ["Industry"]}
        titleLead="AI in"
        titleAccent={getIndustrySearchName(detail.slug, detail.name)}
        stats={[
          { label: "Use Cases", value: detail.useCaseCount },
          { label: "Organizations", value: detail.companyCount },
          { label: "Countries/Regions", value: detail.countryCount },
          { label: "Latest Update", value: formatDate(detail.latestUpdatedAt) },
        ]}
      >
        <p className="text-slate-400">{detail.metadata.shortDescription}</p>
        <p>{detail.summary}</p>
        <p className="pt-2">
          <Link
            href={useCasesHref}
            className="inline-flex min-h-11 items-center gap-2 bg-[var(--accent)] px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-slate-950 transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]"
          >
            View all {detail.name} use cases
          </Link>
        </p>
      </HubHero>

      <div className={`${bodyPad} hub-sharp space-y-6 py-8`} style={{ "--accent": accent } as CSSProperties}>
        <div className="grid gap-4 lg:grid-cols-2">
          <HubBarList title="Top Countries/Regions" items={detail.relatedCountries} accent={accent} />
          <HubBarList title="Top Organizations" items={detail.topCompanies} accent={accent} />
        </div>

        <IndustryRelatedReports reports={detail.relatedReports} />

        <section className="hub-frame p-5">
          <HubHeading
            aside={
              <Link href={useCasesHref} className="text-[var(--accent)] transition-colors hover:text-white">
                Open filtered index ↗
              </Link>
            }
          >
            Recent use cases
          </HubHeading>
          <div className="mt-5" />

          {detail.recentUseCases.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {detail.recentUseCases.map((useCase) => (
                <IndustryUseCaseCard key={useCase.id} useCase={useCase} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-slate-800 bg-[#121212] px-4 py-6 text-center text-sm text-slate-500">
              No recent use cases available for this industry yet.
            </p>
          )}
        </section>

        <UseCaseLinkIndex
          rows={detail.allUseCases}
          title={`All ${detail.name} use cases`}
          description={`Every ${detail.name} deployment tracked in the catalog, A-Z.`}
        />

        {sector && siblings.length > 0 ? (
          <HubBarList title={`More in ${sector.name}`} items={siblings} accent={accent} />
        ) : null}

        <SectorNav groups={groups} current={sector?.slug} />
      </div>

      <div className={`${bodyPad} mt-8 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]`}>
        <AtlasSiteFooter latestDataUpdateCet={latestDataUpdateCet} layout="inline" />
      </div>
    </main>
  )
}
