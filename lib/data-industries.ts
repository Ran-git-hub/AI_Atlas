import { getBlogPostsWithRelatedCaseIds } from "@/lib/data-blog"
import { getIndustryMetadata, type IndustryMetadata } from "@/lib/industry-metadata"
import { getUseCasesCatalogRows } from "@/lib/data"
import type { BlogPostRelatedItem } from "@/lib/types-blog"
import type { UseCaseCatalogRow } from "@/lib/types"

type CountItem = {
  name: string
  count: number
}

export type IndustrySummary = {
  name: string
  slug: string
  metadata: IndustryMetadata
  useCaseCount: number
  companyCount: number
  countryCount: number
  topCountries: CountItem[]
  latestUpdatedAt?: string | null
}

export type IndustryDetail = IndustrySummary & {
  summary: string
  recentUseCases: UseCaseCatalogRow[]
  topCompanies: CountItem[]
  relatedCountries: CountItem[]
  relatedReports: BlogPostRelatedItem[]
}

type IndustryBucket = {
  name: string
  slug: string
  rows: UseCaseCatalogRow[]
}

const UNCATEGORIZED_INDUSTRY = "Uncategorized"

function cleanValue(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

export function slugifyTaxonomyValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function latestTimestamp(rows: UseCaseCatalogRow[]): string | null {
  let latestMs = -Infinity
  let latestIso: string | null = null

  for (const row of rows) {
    const raw = row.updated_at || row.created_at
    if (!raw) continue
    const ms = Date.parse(raw)
    if (Number.isFinite(ms) && ms > latestMs) {
      latestMs = ms
      latestIso = raw
    }
  }

  return latestIso
}

function countBy(values: string[]): CountItem[] {
  const counts = new Map<string, number>()
  for (const value of values) {
    const clean = value.trim()
    if (!clean) continue
    counts.set(clean, (counts.get(clean) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

function uniqueCount(values: string[]): number {
  return new Set(values.map((value) => value.trim()).filter(Boolean)).size
}

function rowCompanyName(row: UseCaseCatalogRow): string {
  return cleanValue(row.company_name) || cleanValue(row.company_id)
}

function sortRecentRows(rows: UseCaseCatalogRow[]): UseCaseCatalogRow[] {
  return [...rows].sort((a, b) => {
    const aMs = Date.parse(a.updated_at || a.created_at || "")
    const bMs = Date.parse(b.updated_at || b.created_at || "")
    const safeA = Number.isFinite(aMs) ? aMs : 0
    const safeB = Number.isFinite(bMs) ? bMs : 0
    return safeB - safeA
  })
}

function buildIndustryBuckets(rows: UseCaseCatalogRow[]): IndustryBucket[] {
  const bySlug = new Map<string, IndustryBucket>()

  for (const row of rows) {
    const industry = cleanValue(row.industry) || UNCATEGORIZED_INDUSTRY

    const slug = slugifyTaxonomyValue(industry)
    if (!slug) continue

    const existing = bySlug.get(slug)
    if (existing) {
      existing.rows.push(row)
    } else {
      bySlug.set(slug, {
        name: industry,
        slug,
        rows: [row],
      })
    }
  }

  return Array.from(bySlug.values())
}

function bucketToSummary(bucket: IndustryBucket): IndustrySummary {
  const companies = bucket.rows.map(rowCompanyName)
  const countries = bucket.rows.map((row) => cleanValue(row.country))

  return {
    name: bucket.name,
    slug: bucket.slug,
    metadata: getIndustryMetadata(bucket.slug),
    useCaseCount: bucket.rows.length,
    companyCount: uniqueCount(companies),
    countryCount: uniqueCount(countries),
    topCountries: countBy(countries).slice(0, 4),
    latestUpdatedAt: latestTimestamp(bucket.rows),
  }
}

function joinNames(items: CountItem[], limit: number): string {
  const names = items.slice(0, limit).map((item) => item.name)
  if (names.length === 0) return ""
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

function buildIndustrySummaryText({
  name,
  useCaseCount,
  companyCount,
  countryCount,
  relatedCountries,
  topCompanies,
}: {
  name: string
  useCaseCount: number
  companyCount: number
  countryCount: number
  relatedCountries: CountItem[]
  topCompanies: CountItem[]
}): string {
  const leadingCountries = joinNames(relatedCountries, 2)
  const leadingCompanies = joinNames(topCompanies, 2)
  const base = `${name} has ${useCaseCount.toLocaleString()} tracked AI use cases across ${countryCount.toLocaleString()} countries/regions and ${companyCount.toLocaleString()} companies/organizations.`

  if (leadingCountries && leadingCompanies) {
    return `${base} Activity is led by ${leadingCountries}, with frequent examples from ${leadingCompanies}.`
  }

  if (leadingCountries) {
    return `${base} Activity is most concentrated in ${leadingCountries}.`
  }

  if (leadingCompanies) {
    return `${base} Frequent examples include ${leadingCompanies}.`
  }

  return `${base} New examples are added as AI Atlas collects and verifies deployments.`
}

function normalizeMatchText(value: string): string {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim()
}

function findRelatedReports({
  reports,
  industryName,
  industrySlug,
  useCaseIds,
}: {
  reports: BlogPostRelatedItem[]
  industryName: string
  industrySlug: string
  useCaseIds: Set<string>
}): BlogPostRelatedItem[] {
  const industryNeedle = normalizeMatchText(industryName)
  const slugNeedle = normalizeMatchText(industrySlug)

  return reports
    .filter((report) => {
      if (report.postKind !== "weekly_report") return false

      const hasRelatedCase = report.relatedCaseIds.some((id) => useCaseIds.has(String(id)))
      if (hasRelatedCase) return true

      const tagText = report.tags.map(normalizeMatchText).join(" ")
      if (tagText.includes(industryNeedle) || tagText.includes(slugNeedle)) return true

      const text = normalizeMatchText(`${report.title} ${report.summary}`)
      return text.includes(industryNeedle) || text.includes(slugNeedle)
    })
    .slice(0, 3)
}

export async function getIndustrySummaries(): Promise<IndustrySummary[]> {
  const rows = await getUseCasesCatalogRows()

  return buildIndustryBuckets(rows)
    .map(bucketToSummary)
    .sort((a, b) => b.useCaseCount - a.useCaseCount || a.name.localeCompare(b.name))
}

export async function getIndustryDetail(slug: string): Promise<IndustryDetail | null> {
  const [rows, reports] = await Promise.all([
    getUseCasesCatalogRows(),
    getBlogPostsWithRelatedCaseIds(),
  ])
  const bucket = buildIndustryBuckets(rows).find((item) => item.slug === slug)

  if (!bucket) return null

  const summary = bucketToSummary(bucket)
  const recentUseCases = sortRecentRows(bucket.rows).slice(0, 8)
  const topCompanies = countBy(bucket.rows.map(rowCompanyName)).slice(0, 8)
  const relatedCountries = countBy(bucket.rows.map((row) => cleanValue(row.country))).slice(0, 8)
  const useCaseIds = new Set(bucket.rows.map((row) => String(row.id)).filter(Boolean))
  const relatedReports = findRelatedReports({
    reports,
    industryName: bucket.name,
    industrySlug: bucket.slug,
    useCaseIds,
  })

  return {
    ...summary,
    summary: buildIndustrySummaryText({
      name: summary.name,
      useCaseCount: summary.useCaseCount,
      companyCount: summary.companyCount,
      countryCount: summary.countryCount,
      relatedCountries,
      topCompanies,
    }),
    recentUseCases,
    topCompanies,
    relatedCountries,
    relatedReports,
  }
}
