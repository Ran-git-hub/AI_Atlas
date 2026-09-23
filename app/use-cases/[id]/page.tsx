import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { cache } from "react"
import { unstable_cache } from "next/cache"
import {
  getCachedLatestAtlasDataUpdateCetDisplay,
  getCachedUseCasesCatalogRows,
  getUseCaseCatalogRowById,
  getUseCasesCatalogRows,
} from "@/lib/data"
import { CACHE_TAGS } from "@/lib/cache-tags"
import type { UseCaseCatalogRow } from "@/lib/types"
import { isUseCasePendingValidation, isUseCasePublished, useCaseDisplayName } from "@/lib/types"
import { hasAdminSession } from "@/lib/admin-session"
import { getCachedIndustrySummaries, slugifyTaxonomyValue } from "@/lib/data-industries"
import { getCachedCountrySummaries } from "@/lib/data-countries"
import { AtlasAppTopRow } from "@/components/atlas-app-top-row"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"
import { ShareRow } from "@/components/share-row"
import { pageMetadata } from "@/lib/page-metadata"
import { absoluteUrl } from "@/lib/site-url"
import {
  breadcrumbSchema,
  jsonLdProps,
  useCaseArticleSchema,
} from "@/lib/structured-data"
import { USE_CASE_PANEL_ACCENT } from "@/lib/use-case-panel-accent"
import { cn } from "@/lib/utils"

import { formatAtlasDate } from "@/lib/format-date"
import { StatusBadge } from "@/components/status-badge"

const ACCENT = USE_CASE_PANEL_ACCENT

const detailShellPad =
  "mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]"

/** content is the page body; URL is the View source button. */
const DETAIL_OMITTED_KEYS = new Set(["content", "url", "title"])

function formatDetailDate(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return trimmed
  return formatAtlasDate(date)
}

function isRecentUseCase(row: UseCaseCatalogRow): boolean {
  const ts = Date.parse(row.updated_at ?? row.created_at ?? "")
  return Number.isFinite(ts) && Date.now() - ts <= 24 * 60 * 60 * 1000
}

function primaryExternalUrl(row: UseCaseCatalogRow): string | null {
  for (const v of [row.reference_url, row.url, row.website_url]) {
    const t = v?.trim()
    if (t && /^https?:\/\//i.test(t)) return t
  }
  return null
}

function subtitleForHero(row: UseCaseCatalogRow): string {
  const d = row.description?.trim()
  if (d) {
    const oneLine = d.split(/\n+/)[0]?.trim()
    if (oneLine && oneLine.length > 180) return `${oneLine.slice(0, 177)}…`
    if (oneLine) return oneLine
  }
  const parts = [row.industry?.trim(), row.sector?.trim()].filter(Boolean)
  if (parts.length) return parts.join(" · ")
  return "Documented AI deployment in the AI Atlas catalog."
}

type UseCaseDetailPageProps = {
  params: Promise<{ id: string }>
}

type RelatedUseCase = {
  row: UseCaseCatalogRow
  reasons: string[]
  score: number
}

const RELATED_STOP_WORDS = new Set([
  "about",
  "after",
  "agent",
  "across",
  "also",
  "and",
  "are",
  "artificial",
  "based",
  "case",
  "company",
  "deploy",
  "deployed",
  "deploying",
  "deployment",
  "from",
  "for",
  "into",
  "its",
  "the",
  "this",
  "through",
  "use",
  "uses",
  "using",
  "with",
])

function cleanComparable(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? ""
}

function useCaseTokens(row: UseCaseCatalogRow): Set<string> {
  const text = [
    useCaseDisplayName(row),
    row.description,
    row.sector,
    row.industry,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  const words = text.match(/[a-z0-9]{3,}/g) ?? []
  return new Set(words.filter((word) => !RELATED_STOP_WORDS.has(word)))
}

function formatCardDate(value: string | null | undefined): string {
  if (!value) return "Unknown date"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown date"
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function relatedUseCasesFor(
  row: UseCaseCatalogRow,
  rows: UseCaseCatalogRow[],
  limit = 6
): RelatedUseCase[] {
  const baseCompany = cleanComparable(row.company_name || row.company_id)
  const baseIndustry = cleanComparable(row.industry)
  const baseCountry = cleanComparable(row.country)
  const baseCity = cleanComparable(row.city)
  const baseTokens = useCaseTokens(row)

  return rows
    .filter((candidate) => candidate.id !== row.id)
    .map((candidate) => {
      let score = 0
      const reasons: string[] = []
      const company = cleanComparable(candidate.company_name || candidate.company_id)
      const industry = cleanComparable(candidate.industry)
      const country = cleanComparable(candidate.country)
      const city = cleanComparable(candidate.city)

      if (baseCompany && company && baseCompany === company) {
        score += 10
        reasons.push("Same company")
      }
      if (baseIndustry && industry && baseIndustry === industry) {
        score += 7
        reasons.push("Same industry")
      }
      if (baseCountry && country && baseCountry === country) {
        score += 4
        reasons.push("Same country")
      }
      if (baseCity && city && baseCity === city) {
        score += 3
        reasons.push("Same city")
      }

      let sharedTerms = 0
      for (const token of useCaseTokens(candidate)) {
        if (baseTokens.has(token)) sharedTerms += 1
      }
      if (sharedTerms > 0) {
        score += Math.min(sharedTerms, 8)
        if (reasons.length < 2) reasons.push(`${sharedTerms} shared terms`)
      }

      return { row: candidate, reasons, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const bTime = Date.parse(b.row.updated_at ?? b.row.created_at ?? "") || 0
      const aTime = Date.parse(a.row.updated_at ?? a.row.created_at ?? "") || 0
      return bTime - aTime
    })
    .slice(0, limit)
}

/**
 * Scoring the whole catalogue against one row - four string comparisons plus a
 * regex tokenisation of title, description, sector and industry for each of
 * ~690 candidates - used to run on every request, after deserialising the
 * 860 KB catalogue out of the data cache just to feed it. The result only
 * changes when the catalogue does, so it is computed once for every case and
 * cached under the catalogue's own tag; see getCachedRelatedIndex.
 */

/** Exactly what a related-case card renders, so the index below stays small. */
type RelatedCard = Pick<
  UseCaseCatalogRow,
  "id" | "title" | "name" | "status" | "company_name" | "industry" | "country" | "created_at" | "updated_at"
>

function toRelatedCard(row: UseCaseCatalogRow): RelatedCard {
  return {
    id: row.id,
    title: row.title,
    name: row.name,
    status: row.status,
    company_name: row.company_name,
    industry: row.industry,
    country: row.country,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

type RelatedIndex = {
  /** Related ids per published case, best first. */
  byId: Record<string, string[]>
  /** One card per case that appears in any list, shared rather than repeated. */
  cards: Record<string, RelatedCard>
}

/**
 * The related lists for every published case at once, under a single key.
 *
 * This replaced a per-id cache, and the reason is a Next behaviour that is easy
 * to miss: unstable_cache does not read the cache when it is called inside
 * another unstable_cache's callback (node_modules/next/dist/server/web/
 * spec-extension/unstable-cache.js, "when we are nested inside of other
 * unstable_cache's we should bypass cache"). The per-id version called
 * getCachedUseCasesCatalogRows inside its callback, so every per-id miss was a
 * full catalogue pull from Supabase - ~306 kB, and with crawlers walking ~700
 * case pages a day, about 150 MB a day of egress against a 5 GB monthly cap.
 *
 * Here the catalogue is fetched uncached, deliberately and visibly, once per
 * revalidation, and scored for every case in one pass. A page reads the index
 * and looks itself up; the scan never runs per request.
 */
const getCachedRelatedIndex = unstable_cache(
  async (): Promise<RelatedIndex> => {
    const rows = await getUseCasesCatalogRows({ publishedOnly: true })
    const byId: Record<string, string[]> = {}
    const cards: Record<string, RelatedCard> = {}
    for (const row of rows) {
      const related = relatedUseCasesFor(row, rows)
      byId[row.id] = related.map((item) => item.row.id)
      for (const item of related) cards[item.row.id] ??= toRelatedCard(item.row)
    }
    return { byId, cards }
  },
  ["use-case-related-index-v1"],
  { revalidate: 86400, tags: [CACHE_TAGS.useCases] },
)

/**
 * A published case is looked up in the index. A pending one is not in the
 * published catalogue, so it is scored on the spot - rare, and it reads the
 * catalogue at the top level, where the cache does apply.
 */
async function relatedCardsFor(row: UseCaseCatalogRow, index: RelatedIndex): Promise<RelatedCard[]> {
  const ids = index.byId[row.id]
  if (ids) return ids.map((id) => index.cards[id]).filter(Boolean)
  const rows = await getCachedUseCasesCatalogRows()
  return relatedUseCasesFor(row, rows).map((item) => toRelatedCard(item.row))
}

function RelatedUseCaseCard({ card: row }: { card: RelatedCard }) {
  const title = useCaseDisplayName(row)
  const isPending = isUseCasePendingValidation(row)
  const meta = [
    row.company_name?.trim(),
    row.industry?.trim(),
    row.country?.trim(),
  ].filter(Boolean)
  const date = formatCardDate(row.updated_at || row.created_at)

  return (
    <Link
      href={`/use-cases/${encodeURIComponent(row.id)}`}
      className="group block rounded-lg border border-slate-800 bg-[#121212] p-3 transition-colors hover:border-slate-700 hover:bg-slate-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
    >
      <h3
        className="line-clamp-3 text-sm font-semibold leading-snug text-[#f5f5f5] transition-colors group-hover:text-[#7ee2b5]"
      >
        {title}
      </h3>
      {isPending ? (
        <StatusBadge kind="pending" className="mt-2" />
      ) : null}
      {meta.length > 0 ? (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
          {meta.join(" · ")}
        </p>
      ) : null}
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{date}</p>
    </Link>
  )
}

/**
 * The row this viewer may see. An unpublished case has not been through human
 * review, so it exists for an admin session only; everyone else gets the same
 * 404 as for an id that does not exist. Memoised per request so the metadata
 * and the page share one lookup, as getUseCaseCatalogRowById does.
 */
const getViewableRow = cache(async (id: string) => {
  const row = await getUseCaseCatalogRowById(id)
  if (!row) return null
  if (isUseCasePublished(row)) return row
  return (await hasAdminSession()) ? row : null
})

export async function generateMetadata({
  params,
}: UseCaseDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const row = await getViewableRow(id)
  if (!row) return { title: "Use case" }
  const title = useCaseDisplayName(row)
  const desc = row.description?.trim()
  const description =
    desc || `${title} — explore this AI use case in the AI Atlas catalog.`
  // Without these the root layout's homepage canonical/openGraph are inherited,
  // so every use case page reports itself as a duplicate of the homepage and
  // shares as a generic "AI Atlas" card. The image comes from this route's
  // opengraph-image.tsx unless the record carries its own.
  const metadata = pageMetadata({
    title: `${title} · AI Atlas`,
    description,
    path: `/use-cases/${encodeURIComponent(row.id)}`,
    image: row.image_url,
    type: "article",
  })
  // Only an admin reaches an unpublished case, but keep it out of any index
  // regardless of how its URL travels.
  return isUseCasePublished(row) ? metadata : { ...metadata, robots: { index: false, follow: false } }
}

export default async function UseCaseDetailPage({ params }: UseCaseDetailPageProps) {
  const { id } = await params
  const [row, relatedIndex, latestDataUpdateCet, industries, countries] = await Promise.all([
    getViewableRow(id),
    getCachedRelatedIndex(),
    getCachedLatestAtlasDataUpdateCetDisplay(),
    getCachedIndustrySummaries(),
    getCachedCountrySummaries(),
  ])
  if (!row) notFound()
  const relatedUseCases = await relatedCardsFor(row, relatedIndex)

  const title = useCaseDisplayName(row)
  const subtitle = subtitleForHero(row)
  const ctaUrl = primaryExternalUrl(row)
  const isPending = isUseCasePendingValidation(row)
  const isRecent = isRecentUseCase(row)
  const heroImage = row.image_url?.trim()
  const canonicalPath = absoluteUrl(`/use-cases/${encodeURIComponent(row.id)}`)
  // Only link the hub when a page actually exists for it: industry buckets are
  // built from published rows, so a pending case can carry an industry that has
  // no hub yet, and an unguarded link would point at a 404.
  const industryName = row.industry?.trim() ?? ""
  const industrySlug = industryName ? slugifyTaxonomyValue(industryName) : ""
  const hasIndustryHub =
    industrySlug !== "" && industries.some((item) => item.slug === industrySlug)
  const countryName = row.country?.trim() ?? ""
  const countrySlug = countryName ? slugifyTaxonomyValue(countryName) : ""
  const hasCountryHub =
    countrySlug !== "" && countries.some((item) => item.slug === countrySlug)
  // subtitleForHero truncates for the hero; an email should carry the whole
  // sentence rather than a trailing ellipsis.
  const shareDescription = row.description?.trim().split(/\n+/)[0]?.trim() || null
  const shareMeta = [
    row.company_name?.trim(),
    row.industry?.trim(),
    [row.city?.trim(), row.country?.trim()].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" · ")
  // The write-up itself, lifted out of fieldEntries so it reads as the page
  // body rather than a row in a database dump.
  const articleBody =
    (row.fieldEntries ?? [])
      .find((entry) => entry.key.toLowerCase() === "content")
      ?.value.trim() || null

  // Everything else worth showing. content is the body above and URL is the
  // View source button, so both would only repeat themselves here.
  const detailEntries = (row.fieldEntries ?? [])
    .filter((entry) => !DETAIL_OMITTED_KEYS.has(entry.key.toLowerCase()))
    .map((entry) => ({
      ...entry,
      value: entry.key.toLowerCase() === "created_at"
        ? formatDetailDate(entry.value)
        : entry.value.trim(),
    }))
    .filter((entry) => entry.value)

  const structuredData = [
    useCaseArticleSchema({
      id: row.id,
      title,
      description: shareDescription,
      companyName: row.company_name,
      industry: row.industry,
      country: row.country,
      createdAt: row.created_at,
      sourceUrl: ctaUrl,
    }),
    breadcrumbSchema([
      { name: "AI Atlas", path: "/" },
      { name: "Use cases", path: "/use-cases" },
      { name: title, path: `/use-cases/${encodeURIComponent(row.id)}` },
    ]),
  ]

  return (
    <main
      className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]"
      style={{ colorScheme: "dark" }}
    >
      {structuredData.map((schema, index) => (
        // eslint-disable-next-line react/no-danger
        <script key={index} {...jsonLdProps(schema)} />
      ))}
      <div className="border-b border-slate-800 bg-[#121212]">
        <div className={detailShellPad}>
          <AtlasAppTopRow activeView="use-cases" />
          <div className="mt-4 w-full min-w-0 border-t border-slate-800/80 pt-5">
            <Link
              href="/use-cases"
              className="inline-flex items-center gap-1.5 rounded-sm text-xs font-medium text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Use cases
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <p
                className="text-sm font-medium uppercase tracking-wide"
                style={{ color: ACCENT }}
              >
                AI Use Case
              </p>
              {isRecent ? (
                <StatusBadge kind="new" />
              ) : null}
              {isPending ? (
                <StatusBadge kind="pending" />
              ) : null}
            </div>
            <h1 className="mt-3 max-w-4xl text-balance text-3xl font-bold leading-tight text-[#f5f5f5] md:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-pretty text-base leading-relaxed text-slate-400">
              {subtitle}
            </p>
            {hasIndustryHub || hasCountryHub ? (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                {hasIndustryHub ? (
                  <span className="flex items-center gap-2">
                    <span className="text-slate-500">Industry</span>
                    <Link
                      href={`/industries/${industrySlug}`}
                      className="inline-flex items-center rounded-full border border-slate-700 bg-[#1a1a1a] px-3 py-1 font-medium text-slate-200 transition-colors hover:border-[#43cc93]/60 hover:text-[#43cc93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
                    >
                      {industryName}
                    </Link>
                  </span>
                ) : null}
                {hasCountryHub ? (
                  <span className="flex items-center gap-2">
                    <span className="text-slate-500">Country/Region</span>
                    <Link
                      href={`/countries/${countrySlug}`}
                      className="inline-flex items-center rounded-full border border-slate-700 bg-[#1a1a1a] px-3 py-1 font-medium text-slate-200 transition-colors hover:border-[#43cc93]/60 hover:text-[#43cc93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
                    >
                      {countryName}
                    </Link>
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {ctaUrl ? (
                <a
                  href={ctaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#04160e] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45"
                  style={{ backgroundColor: ACCENT }}
                >
                  View source
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              ) : null}
              <Link
                href="/use-cases"
                className="inline-flex items-center rounded-full border border-slate-700 bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
              >
                Browse catalog
              </Link>
            </div>
            <div className="mt-5 border-t border-slate-800/80 pt-4">
              <ShareRow
                url={canonicalPath}
                title={title}
                description={shareDescription}
                meta={shareMeta}
                emailSubject={`AI Atlas: ${title}`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        {heroImage ? (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#1a1a1a]">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={heroImage}
                alt=""
                fill
                className="object-contain p-4 md:p-8"
                sizes="(max-width: 1280px) 100vw, 1280px"
                priority
              />
            </div>
          </div>
        ) : null}

        <section
          className={cn(
            "grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start",
            heroImage ? "mt-8" : undefined,
          )}
        >
          <div className="min-w-0">
            {articleBody ? (
              <div className="whitespace-pre-wrap break-words text-[15px] leading-[1.8] text-slate-200">
                {articleBody}
              </div>
            ) : null}

            {detailEntries.length > 0 ? (
              <div className="mt-10 border-t border-slate-800 pt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Details
                </h2>
                <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {detailEntries.map(({ key, label, value }) => (
                    <div key={key}>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {label}
                      </dt>
                      <dd className="mt-1 break-words text-sm leading-relaxed text-slate-200">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-4">
            <div className="rounded-xl border border-slate-800 bg-[#1a1a1a] p-4">
              <h2 className="text-base font-semibold text-[#f5f5f5]">
                Related use cases
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Similar deployments from the catalog.
              </p>

              {relatedUseCases.length > 0 ? (
                <div className="mt-4 space-y-2.5">
                  {relatedUseCases.map((card) => (
                    <RelatedUseCaseCard key={card.id} card={card} />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  No related use cases found yet.
                </p>
              )}
            </div>
          </aside>
        </section>

        <section className="mt-8 flex flex-col items-start gap-4 rounded-xl border border-slate-800 bg-[#1a1a1a] px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-slate-300">
            Continue exploring AI deployments in the catalog.
          </p>
          <Link
            href="/use-cases"
            className="inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold text-[#04160e] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45"
            style={{ backgroundColor: ACCENT }}
          >
            Back to use cases
          </Link>
        </section>
      </div>

      <div className="mx-auto mt-8 max-w-7xl px-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        <AtlasSiteFooter latestDataUpdateCet={latestDataUpdateCet} layout="inline" />
      </div>
    </main>
  )
}
