import { unstable_cache } from "next/cache"
import { getCachedUseCasesCatalogRows } from "@/lib/data"
import { slugifyTaxonomyValue } from "@/lib/data-industries"
import type { UseCaseCatalogRow } from "@/lib/types"

type CountItem = {
  name: string
  count: number
}

export type CountrySummary = {
  name: string
  slug: string
  useCaseCount: number
  companyCount: number
  industryCount: number
  topIndustries: CountItem[]
  latestUpdatedAt?: string | null
}

export type CountryDetail = CountrySummary & {
  summary: string
  recentUseCases: UseCaseCatalogRow[]
  /** Every case in the bucket, so the hub links to all of them. */
  allUseCases: UseCaseCatalogRow[]
  topCompanies: CountItem[]
  relatedIndustries: CountItem[]
}

type CountryBucket = {
  name: string
  slug: string
  rows: UseCaseCatalogRow[]
}

function cleanValue(value: string | null | undefined): string {
  return value?.trim() ?? ""
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

function sortRecentRows(rows: UseCaseCatalogRow[]): UseCaseCatalogRow[] {
  return [...rows].sort((a, b) => {
    const aMs = Date.parse(a.updated_at || a.created_at || "")
    const bMs = Date.parse(b.updated_at || b.created_at || "")
    return (Number.isFinite(bMs) ? bMs : 0) - (Number.isFinite(aMs) ? aMs : 0)
  })
}

/**
 * Unlike industries, rows with no country are dropped rather than collected
 * into a catch-all bucket: "Uncategorized" is a real industry label in the
 * taxonomy but not a place, and a hub page for it would say nothing.
 */
function buildCountryBuckets(rows: UseCaseCatalogRow[]): CountryBucket[] {
  const bySlug = new Map<string, CountryBucket>()

  for (const row of rows) {
    const country = cleanValue(row.country)
    if (!country) continue

    const slug = slugifyTaxonomyValue(country)
    if (!slug) continue

    const existing = bySlug.get(slug)
    if (existing) {
      existing.rows.push(row)
    } else {
      bySlug.set(slug, { name: country, slug, rows: [row] })
    }
  }

  return Array.from(bySlug.values())
}

function bucketToSummary(bucket: CountryBucket): CountrySummary {
  const companies = bucket.rows.map(rowCompanyName)
  const industries = bucket.rows.map((row) => cleanValue(row.industry))

  return {
    name: bucket.name,
    slug: bucket.slug,
    useCaseCount: bucket.rows.length,
    companyCount: uniqueCount(companies),
    industryCount: uniqueCount(industries),
    topIndustries: countBy(industries).slice(0, 4),
    latestUpdatedAt: latestTimestamp(bucket.rows),
  }
}

function joinNames(items: CountItem[], limit: number): string {
  const names = items.slice(0, limit).map((item) => item.name)
  if (names.length === 0) return ""
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

function buildCountrySummaryText({
  name,
  useCaseCount,
  companyCount,
  industryCount,
  relatedIndustries,
  topCompanies,
}: {
  name: string
  useCaseCount: number
  companyCount: number
  industryCount: number
  relatedIndustries: CountItem[]
  topCompanies: CountItem[]
}): string {
  const leadingIndustries = joinNames(relatedIndustries, 2)
  const leadingCompanies = joinNames(topCompanies, 2)
  const base = `${name} has ${useCaseCount.toLocaleString()} tracked AI use cases across ${industryCount.toLocaleString()} industries and ${companyCount.toLocaleString()} organizations.`

  if (leadingIndustries && leadingCompanies) {
    return `${base} Activity is led by ${leadingIndustries}, with frequent examples from ${leadingCompanies}.`
  }

  if (leadingIndustries) {
    return `${base} Activity is most concentrated in ${leadingIndustries}.`
  }

  if (leadingCompanies) {
    return `${base} Frequent examples include ${leadingCompanies}.`
  }

  return `${base} New examples are added as AI Atlas collects and verifies deployments.`
}

export async function getCountrySummaries(): Promise<CountrySummary[]> {
  const rows = await getCachedUseCasesCatalogRows()

  return buildCountryBuckets(rows)
    .map(bucketToSummary)
    .sort((a, b) => b.useCaseCount - a.useCaseCount || a.name.localeCompare(b.name))
}

export const getCachedCountrySummaries = unstable_cache(
  async () => getCountrySummaries(),
  ["countries-summaries-v1"],
  { revalidate: 300 },
)

export async function getCountryDetail(slug: string): Promise<CountryDetail | null> {
  const rows = await getCachedUseCasesCatalogRows()
  const bucket = buildCountryBuckets(rows).find((item) => item.slug === slug)

  if (!bucket) return null

  const summary = bucketToSummary(bucket)
  const topCompanies = countBy(bucket.rows.map(rowCompanyName)).slice(0, 8)
  const relatedIndustries = countBy(bucket.rows.map((row) => cleanValue(row.industry))).slice(0, 8)

  return {
    ...summary,
    summary: buildCountrySummaryText({
      name: summary.name,
      useCaseCount: summary.useCaseCount,
      companyCount: summary.companyCount,
      industryCount: summary.industryCount,
      relatedIndustries,
      topCompanies,
    }),
    recentUseCases: sortRecentRows(bucket.rows).slice(0, 8),
    allUseCases: bucket.rows,
    topCompanies,
    relatedIndustries,
  }
}
