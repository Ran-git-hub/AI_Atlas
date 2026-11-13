import { notFound } from "next/navigation"
import type { CSSProperties } from "react"
import { getCachedLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import { getCachedIndustrySummaries, getSectorDetail, groupIndustriesBySector } from "@/lib/data-industries"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"
import { HubBarList } from "@/components/industries/hub-bar-list"
import { HubComposition } from "@/components/industries/hub-composition"
import { HubHeading } from "@/components/industries/hub-heading"
import { HubHero } from "@/components/industries/hub-hero"
import { IndustryUseCaseCard } from "@/components/industries/industry-use-case-card"
import { SectorNav } from "@/components/industries/sector-nav"
import { UseCaseLinkIndex } from "@/components/use-cases/use-case-link-index"
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
  const [detail, industries, latestDataUpdateCet] = await Promise.all([
    getSectorDetail(sector),
    getCachedIndustrySummaries(),
    getCachedLatestAtlasDataUpdateCetDisplay(),
  ])

  if (!detail) {
    notFound()
  }

  return (
    <main className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]" style={{ colorScheme: "dark" }}>
      <script
        {...jsonLdProps(
          breadcrumbSchema([
            { name: "AI Atlas", path: "/" },
            { name: "Industries", path: "/industries" },
            { name: detail.name, path: `/sectors/${encodeURIComponent(detail.slug)}` },
          ]),
        )}
      />
      <HubHero
        accent={detail.accent}
        crumbs={[{ name: "AI Atlas", href: "/" }, { name: "Industries", href: "/industries" }, { name: detail.name }]}
        eyebrow={[
          "Sector",
          `${detail.industries.length} ${detail.industries.length === 1 ? "industry" : "industries"}`,
        ]}
        titleLead="AI in"
        titleAccent={detail.name}
        stats={[
          { label: "Use Cases", value: detail.useCaseCount },
          { label: "Organizations", value: detail.companyCount },
          { label: "Countries/Regions", value: detail.countryCount },
          { label: "Latest Update", value: formatDate(detail.latestUpdatedAt) },
        ]}
      >
        <p>{detail.summary}</p>
      </HubHero>

      <div className={`${bodyPad} hub-sharp space-y-6 py-8`} style={{ "--accent": detail.accent } as CSSProperties}>
        <HubComposition title={`Industries in ${detail.name}`} items={detail.industries} accent={detail.accent} />

        <div className="grid gap-4 lg:grid-cols-2">
          <HubBarList title="Top Countries/Regions" items={detail.relatedCountries} accent={detail.accent} />
          <HubBarList title="Top Organizations" items={detail.topCompanies} accent={detail.accent} />
        </div>

        <section className="hub-frame p-5">
          <HubHeading>Recent use cases</HubHeading>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {detail.recentUseCases.map((useCase) => (
              <IndustryUseCaseCard key={useCase.id} useCase={useCase} />
            ))}
          </div>
        </section>

        <UseCaseLinkIndex
          rows={detail.allUseCases}
          title={`All ${detail.name} use cases`}
          description={`Every ${detail.name} deployment tracked in the catalog, A-Z.`}
          meta="industry"
        />

        <SectorNav groups={groupIndustriesBySector(industries)} current={detail.slug} />
      </div>

      <div className={`${bodyPad} mt-8 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]`}>
        <AtlasSiteFooter latestDataUpdateCet={latestDataUpdateCet} layout="inline" />
      </div>
    </main>
  )
}
