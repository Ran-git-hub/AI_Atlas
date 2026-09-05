import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { unstable_cache } from "next/cache"
import { ArrowLeft, ChevronRight, ExternalLink } from "lucide-react"
import {
  getCachedLatestAtlasDataUpdateCetDisplay,
  getUseCaseCatalogRowById,
  getUseCasesCatalogRows,
} from "@/lib/data"
import type { UseCaseCatalogRow } from "@/lib/types"
import { isUseCasePendingValidation, useCaseDisplayName } from "@/lib/types"
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

// Cache the published use-cases catalog query for 10 minutes so the
// related-use-cases computation doesn't hit Supabase on every request.
//
// Why this exists: /use-cases/[id] pages previously called
// getUseCasesCatalogRows() with no args on every render (~1.7 MB per call).
// With 608 published use cases and Googlebot crawling every URL, that
// produced ~1 GB/day of Supabase egress. After this cache:
//   - First request after deploy/revalidate → 1 DB hit
//   - Subsequent requests within 10 min → 0 DB hits (cache)
//   - Revalidate window: 600s (10 min) — acceptable for "related" list
//
// Scope: only published use cases (matches what the public page should
// show — fixes a side bug where pending/archived rows were leaking into
// the related list).
const getCachedPublishedUseCases = unstable_cache(
  () => getUseCasesCatalogRows({ publishedOnly: true }),
  ["related-use-cases-v1"],
  { revalidate: 600 },
)

const ACCENT = USE_CASE_PANEL_ACCENT

const detailShellPad =
  "mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]"

function isRecentUseCase(row: UseCaseCatalogRow): boolean {
  const ts = Date.parse(row.updated_at ?? row.created_at ?? "")
  return Number.isFinite(ts) && Date.now() - ts <= 24 * 60 * 60 * 1000
}

function isProbablyUrl(key: string, value: string): boolean {
  if (!/^https?:\/\//i.test(value.trim())) return false
  if (value.includes("\n")) return false
  return /url|link|href|website|source|reference/i.test(key)
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const v = value?.trim()
    if (v) return v
  }
  return "—"
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

function RelatedUseCaseCard({ item }: { item: RelatedUseCase }) {
  const row = item.row
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
        <span className="mt-2 inline-flex rounded-full border border-sky-300/45 bg-sky-300/12 px-2 py-0.5 text-[10px] font-semibold text-sky-100">
          To be validated
        </span>
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

export async function generateMetadata({
  params,
}: UseCaseDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const row = await getUseCaseCatalogRowById(id)
  if (!row) return { title: "Use case" }
  const title = useCaseDisplayName(row)
  const desc = row.description?.trim()
  const description =
    desc || `${title} — explore this AI use case in the AI Atlas catalog.`
  // Without these the root layout's homepage canonical/openGraph are inherited,
  // so every use case page reports itself as a duplicate of the homepage and
  // shares as a generic "AI Atlas" card. The image comes from this route's
  // opengraph-image.tsx unless the record carries its own.
  return pageMetadata({
    title: `${title} · AI Atlas`,
    description,
    path: `/use-cases/${encodeURIComponent(row.id)}`,
    image: row.image_url,
    type: "article",
  })
}

export default async function UseCaseDetailPage({ params }: UseCaseDetailPageProps) {
  const { id } = await params
  const [row, allRows, latestDataUpdateCet] = await Promise.all([
    getUseCaseCatalogRowById(id),
    getCachedPublishedUseCases(),
    getCachedLatestAtlasDataUpdateCetDisplay(),
  ])
  if (!row) notFound()

  const title = useCaseDisplayName(row)
  const subtitle = subtitleForHero(row)
  const ctaUrl = primaryExternalUrl(row)
  const relatedUseCases = relatedUseCasesFor(row, allRows)
  const isPending = isUseCasePendingValidation(row)
  const isRecent = isRecentUseCase(row)
  const heroImage = row.image_url?.trim()
  const canonicalPath = absoluteUrl(`/use-cases/${encodeURIComponent(row.id)}`)
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
  const recordEntries = row.fieldEntries.filter(
    (entry) => entry.key.toLowerCase() !== "title",
  )

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
                <span className="inline-flex rounded-full border border-yellow-300/55 bg-yellow-200/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-200">
                  New
                </span>
              ) : null}
              {isPending ? (
                <span className="inline-flex rounded-full border border-sky-300/45 bg-sky-300/12 px-2 py-0.5 text-[10px] font-semibold text-sky-100">
                  To be validated
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 max-w-4xl text-balance text-3xl font-bold leading-tight text-[#f5f5f5] md:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-pretty text-base leading-relaxed text-slate-400">
              {subtitle}
            </p>
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

        <section className={heroImage ? "mt-8" : undefined}>
          <h2 className="text-xl font-semibold text-[#f5f5f5]">At a glance</h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-400">
            Core facts from this catalog record. Every raw field follows below.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                k: "Company/Organization",
                v: firstNonEmpty(row.company_name, row.company_id),
              },
              { k: "Industry", v: firstNonEmpty(row.industry) },
              {
                k: "Location",
                v: firstNonEmpty(row.city, row.country, row.location),
              },
            ].map(({ k, v }) => (
              <div
                key={k}
                className="rounded-xl border border-slate-800 bg-[#1a1a1a] px-4 py-3.5"
              >
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {k}
                </dt>
                <dd className="mt-1.5 text-lg font-semibold leading-snug text-[#f5f5f5]">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          {ctaUrl ? (
            <a
              href={ctaUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 rounded-sm text-sm font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
              style={{ color: ACCENT }}
            >
              Open primary reference
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </a>
          ) : null}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-[#f5f5f5]">Record fields</h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-400">
              Every column from the source row, in stable order. URLs open in a new
              tab.
            </p>

            <div className="mt-4 divide-y divide-slate-800/80 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950/40">
              {recordEntries.map(({ key, label, value }) => {
                const trimmed = value.trim()
                const display = trimmed || "Not Available"
                const url = trimmed && isProbablyUrl(key, trimmed)

                return (
                  <div key={key} className="space-y-1.5 px-4 py-3.5">
                    <div className="text-xs font-medium tracking-wide text-slate-500">
                      {label}
                    </div>
                    {url ? (
                      <a
                        href={trimmed}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 break-all rounded-sm text-sm font-medium transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
                        style={{ color: ACCENT }}
                      >
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        {trimmed}
                      </a>
                    ) : (
                      <p
                        className={cn(
                          "whitespace-pre-wrap break-words text-sm leading-relaxed",
                          trimmed ? "text-slate-200" : "italic text-slate-500"
                        )}
                      >
                        {display}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
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
                  {relatedUseCases.map((item) => (
                    <RelatedUseCaseCard key={item.row.id} item={item} />
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
