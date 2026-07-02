import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import {
  Company,
  UseCaseCatalogRow,
  CompanyWithCoords,
  CITY_COORDINATES,
  USE_CASE_STATUSES,
  type UseCaseFieldEntry,
  type UseCaseStatus,
  UseCaseWithCoords,
} from "./types"

const NON_OFFICIAL_HOST_KEYWORDS = [
  "linkedin.com",
  "x.com",
  "twitter.com",
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "tiktok.com",
  "wikipedia.org",
  "github.com",
]

function normalizeWebsiteUrl(url: string): string {
  const value = url.trim()
  if (!value) return ""
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

function extractHostname(url: string): string {
  const normalized = normalizeWebsiteUrl(url)
  try {
    return new URL(normalized).hostname.toLowerCase()
  } catch {
    return ""
  }
}

function toRootUrl(url: string): string {
  const normalized = normalizeWebsiteUrl(url)
  try {
    const u = new URL(normalized)
    return `https://${u.hostname.toLowerCase()}`
  } catch {
    return normalized
  }
}

function isLikelyOfficialHostname(hostname: string): boolean {
  if (!hostname) return false
  return !NON_OFFICIAL_HOST_KEYWORDS.some((blocked) => hostname.includes(blocked))
}

function buildOfficialWebsiteByCompanyId(
  rows: Record<string, unknown>[] | null
): Map<string, string> {
  const countsByCompany = new Map<string, Map<string, number>>()

  for (const row of rows ?? []) {
    const companyId = row.company_id
    if (companyId === null || companyId === undefined || companyId === "") continue
    const id = String(companyId)
    const sources = [
      row.website_url,
      row.website,
      row.url,
      row.URL,         // actual DB column is uppercase
      row.reference_url,
      row.reference,
      row.source_url,
      row.link,
    ]

    for (const source of sources) {
      if (source === null || source === undefined) continue
      const raw = String(source).trim()
      if (!raw) continue
      const host = extractHostname(raw)
      if (!isLikelyOfficialHostname(host)) continue
      const root = toRootUrl(raw)
      const map = countsByCompany.get(id) ?? new Map<string, number>()
      map.set(root, (map.get(root) ?? 0) + 1)
      countsByCompany.set(id, map)
    }
  }

  const result = new Map<string, string>()
  for (const [companyId, domainCountMap] of countsByCompany.entries()) {
    let bestUrl = ""
    let bestCount = -1
    for (const [url, count] of domainCountMap.entries()) {
      if (count > bestCount) {
        bestUrl = url
        bestCount = count
      }
    }
    if (bestUrl) result.set(companyId, bestUrl)
  }
  return result
}

function withWebsiteFallback(company: Company, officialWebsiteById: Map<string, string>): Company {
  const website =
    company.website_url && company.website_url.trim()
      ? normalizeWebsiteUrl(company.website_url)
      : officialWebsiteById.get(company.id) ?? ""

  return {
    ...company,
    website_url: website,
  }
}

function isArchivedStatus(status: unknown): boolean {
  return String(status ?? "").trim().toLowerCase() === "archived"
}

function isPublishedStatus(status: unknown): boolean {
  return String(status ?? "").trim().toLowerCase() === "published"
}

export async function getAtlasStats(): Promise<{
  totalUseCases: number
  totalCompanies: number
  totalCountries: number
}> {
  const supabase =
    createServiceRoleClient() ?? (await createClient())

  const [
    { count: useCaseCount, error: ucErr },
    { count: companyCount, error: coErr },
    { data: companyRows, error: countryErr },
  ] = await Promise.all([
    supabase
      .from("AI_Atlas_Use_Cases")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("AI_Atlas_Companies")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("AI_Atlas_Companies")
      .select("headquarters_country")
      .eq("status", "published"),
  ])

  if (ucErr) console.error("Error counting use cases for OG image:", ucErr)
  if (coErr) console.error("Error counting companies for OG image:", coErr)
  if (countryErr) console.error("Error fetching countries for OG image:", countryErr)

  const countries = new Set<string>()
  for (const c of (companyRows ?? []) as { headquarters_country?: string | null }[]) {
    const country = c.headquarters_country?.trim()
    if (country) countries.add(country)
  }

  return {
    totalUseCases: useCaseCount ?? 0,
    totalCompanies: companyCount ?? 0,
    totalCountries: countries.size,
  }
}

export async function getCompanies(): Promise<Company[]> {
  const supabase = await createClient()

  const [companiesResult, useCasesResult] = await Promise.all([
    supabase.from("AI_Atlas_Companies").select(
      "id,name,status,description,industry,website_url,logo_url,headquarters_country,city,created_at,latitude,longitude"
    ).order("name"),
    supabase.from("AI_Atlas_Use_Cases").select("id, company_id, \"URL\"")
  ])
  const { data, error } = companiesResult
  
  if (error) {
    console.error("Error fetching companies:", error)
    return []
  }

  if (useCasesResult.error) {
    console.error("Error fetching use case URLs for company websites:", useCasesResult.error)
  }
  
  const officialWebsiteById = buildOfficialWebsiteByCompanyId(
    (useCasesResult.data ?? []) as Record<string, unknown>[]
  )
  return (data || [])
    .filter((company) => !isArchivedStatus((company as Company).status))
    .map((company) => withWebsiteFallback(company as Company, officialWebsiteById))
}

export async function getCompaniesWithCoords(): Promise<CompanyWithCoords[]> {
  const companies = await getCompanies()
  
  return companies.map(company => {
    const raw = company as Company & {
      lat?: number | string | null
      lng?: number | string | null
      latitude?: number | string | null
      longitude?: number | string | null
    }
    const toFinite = (v: unknown): number | null => {
      if (v === null || v === undefined || v === "") return null
      const n = typeof v === "number" ? v : Number(v)
      return Number.isFinite(n) ? n : null
    }
    const dbLat = toFinite(raw.lat ?? raw.latitude)
    const dbLng = toFinite(raw.lng ?? raw.longitude)
    const mapped = CITY_COORDINATES[company.city] || null
    const lat = dbLat ?? mapped?.lat ?? 0
    const lng = dbLng ?? mapped?.lng ?? 0
    return {
      ...company,
      lat,
      lng
    }
  })
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const supabase = await createClient()
  
  const [companyResult, useCasesResult] = await Promise.all([
    supabase
      .from("AI_Atlas_Companies")
      .select("*")
      .eq("id", id)
      .single(),
    supabase
      .from("AI_Atlas_Use_Cases")
      .select("id, company_id, \"URL\"")
      .eq("company_id", id),
  ])
  const { data, error } = companyResult
  
  if (error) {
    console.error("Error fetching company:", error)
    return null
  }

  if (useCasesResult.error) {
    console.error("Error fetching use case URLs for company website:", useCasesResult.error)
  }
  
  const company = data as Company
  if (isArchivedStatus(company.status)) return null

  const officialWebsiteById = buildOfficialWebsiteByCompanyId(
    (useCasesResult.data ?? []) as Record<string, unknown>[]
  )
  return withWebsiteFallback(company, officialWebsiteById)
}

function snakeCaseToFieldLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatUseCaseCell(v: unknown): string {
  if (v === null || v === undefined) return ""
  if (typeof v === "string") return v.trim()
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : ""
  if (typeof v === "boolean") return v ? "Yes" : "No"
  if (typeof v === "object") {
    try {
      return JSON.stringify(v, null, 2)
    } catch {
      return String(v)
    }
  }
  return String(v).trim()
}

/** Detail panel: omit these columns (DB names, case-insensitive). */
const HIDDEN_USE_CASE_DETAIL_KEYS = new Set([
  "is_trending",
  "latitude",
  "longitude",
  "published_at",
  "status",
  "summary",
  "source_name",
  "confidence_score",
  "lat",
  "lng",
])

function normalizeUseCaseFieldKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, "_")
}

function buildCompanyNameById(
  rows: { id: unknown; name: unknown; status?: unknown }[] | null,
  { includeArchived }: { includeArchived: boolean } = { includeArchived: false }
): Map<string, string> {
  const map = new Map<string, string>()
  for (const r of rows ?? []) {
    if (r.id === null || r.id === undefined) continue
    if (!includeArchived && isArchivedStatus(r.status)) continue
    const id = String(r.id)
    const name =
      r.name === null || r.name === undefined ? "" : String(r.name).trim()
    map.set(id, name)
  }
  return map
}

function buildUseCaseFieldEntries(
  row: Record<string, unknown>,
  companyNameById: Map<string, string>
): UseCaseFieldEntry[] {
  const preferredOrder = new Map<string, number>([
    ["title", 10],
    ["content", 20],
    ["url", 30],
    ["id", 990],
    ["created_at", 995],
  ])

  return Object.keys(row)
    .filter((key) => !HIDDEN_USE_CASE_DETAIL_KEYS.has(normalizeUseCaseFieldKey(key)))
    .sort((a, b) => {
      const na = normalizeUseCaseFieldKey(a)
      const nb = normalizeUseCaseFieldKey(b)
      const ra = preferredOrder.get(na) ?? 100
      const rb = preferredOrder.get(nb) ?? 100
      if (ra !== rb) return ra - rb
      return a.localeCompare(b)
    })
    .map((key) => {
      if (normalizeUseCaseFieldKey(key) === "company_id") {
        const rawId = formatUseCaseCell(row[key])
        const resolved =
          rawId && companyNameById.has(rawId)
            ? companyNameById.get(rawId)!
            : ""
        return {
          key,
          label: "Company/Organization",
          value: resolved,
        }
      }
      if (normalizeUseCaseFieldKey(key) === "industry") {
        return {
          key,
          label: "Category",
          value: formatUseCaseCell(row[key]),
        }
      }
      return {
        key,
        label: snakeCaseToFieldLabel(key),
        value: formatUseCaseCell(row[key]),
      }
    })
}

function pickCoord(
  row: Record<string, unknown>,
  keys: string[]
): number | null {
  for (const k of keys) {
    const v = row[k]
    if (v === null || v === undefined || v === "") continue
    const n = typeof v === "number" ? v : Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

/** Normalize a Supabase row from AI_Atlas_Use_Cases into a typed point for the globe. */
function rowToUseCaseWithCoords(
  row: Record<string, unknown>,
  companyNameById: Map<string, string>
): UseCaseWithCoords | null {
  const id = row.id
  if (id === null || id === undefined || id === "") return null
  if (isArchivedStatus(row.status)) return null

  const lat = pickCoord(row, ["lat", "latitude", "Lat", "Latitude"])
  const lng = pickCoord(row, ["lng", "longitude", "lon", "Lng", "Longitude"])
  if (lat === null || lng === null) return null

  const str = (v: unknown) =>
    v === null || v === undefined ? null : String(v)

  return {
    id: String(id),
    company_id: str(row.company_id),
    status: str(row.status),
    title: str(row.title ?? row.use_case_title ?? row.case_title),
    name: str(row.name ?? row.use_case_name),
    description: str(row.description ?? row.summary ?? row.details),
    sector: str(row.sector),
    industry: str(row.industry),
    city: str(row.city),
    country: str(row.country ?? row.headquarters_country),
    location: str(row.location),
    company_name: str(row.company_name),
    website_url: str(row.website_url),
    reference_url: str(row.reference_url),
    url: str(row.url),
    image_url: str(row.image_url),
    created_at: str(row.created_at),
    updated_at: str(row.updated_at),
    lat,
    lng,
    fieldEntries: buildUseCaseFieldEntries(row, companyNameById),
  }
}

function rowToUseCaseCatalogRow(
  row: Record<string, unknown>,
  companyNameById: Map<string, string>,
  { includeArchived, publishedOnly }: { includeArchived: boolean; publishedOnly: boolean } = {
    includeArchived: false,
    publishedOnly: false,
  }
): UseCaseCatalogRow | null {
  const id = row.id
  if (id === null || id === undefined || id === "") return null
  if (!includeArchived && isArchivedStatus(row.status)) return null
  if (publishedOnly && !isPublishedStatus(row.status)) return null

  const str = (v: unknown) =>
    v === null || v === undefined ? null : String(v)
  const companyId = str(row.company_id)
  const normalizedCompanyName =
    str(row.company_name)?.trim() ||
    (companyId ? companyNameById.get(companyId)?.trim() : "") ||
    null
  const lat = pickCoord(row, ["lat", "latitude", "Lat", "Latitude"])
  const lng = pickCoord(row, ["lng", "longitude", "lon", "Lng", "Longitude"])

  return {
    id: String(id),
    company_id: companyId,
    status: str(row.status),
    title: str(row.title ?? row.use_case_title ?? row.case_title),
    name: str(row.name ?? row.use_case_name),
    description: str(row.description ?? row.summary ?? row.details),
    sector: str(row.sector),
    industry: str(row.industry),
    city: str(row.city),
    country: str(row.country ?? row.headquarters_country),
    location: str(row.location),
    company_name: normalizedCompanyName,
    website_url: str(row.website_url),
    reference_url: str(row.reference_url),
    url: str(row.url),
    image_url: str(row.image_url),
    created_at: str(row.created_at),
    updated_at: str(row.updated_at),
    lat,
    lng,
    fieldEntries: buildUseCaseFieldEntries(row, companyNameById),
  }
}

export async function getUseCasesWithCoords(
  opts: { publishedOnly?: boolean } = {}
): Promise<UseCaseWithCoords[]> {
  const { publishedOnly = false } = opts
  // Prefer service role on the server so reads work even when RLS has no policy yet.
  // For production, prefer fixing RLS (see supabase/migrations) and you may omit the service key.
  const supabase =
    createServiceRoleClient() ?? (await createClient())

  let useCasesQuery = supabase
    .from("AI_Atlas_Use_Cases")
    .select("id,company_id,type,title,summary,industry,continent,country,city,latitude,longitude,published_at,status,is_trending,source_name,confidence_score,created_at,\"URL\"")
    .order("id", { ascending: true })

  if (publishedOnly) {
    useCasesQuery = useCasesQuery.eq("status", "published")
  }

  const [companiesResult, useCasesResult] = await Promise.all([
    supabase.from("AI_Atlas_Companies").select("id, name, status").order("name"),
    useCasesQuery,
  ])

  if (companiesResult.error) {
    console.error("Error fetching companies for use case labels:", companiesResult.error)
  }

  if (useCasesResult.error) {
    console.error("Error fetching use cases:", useCasesResult.error)
    return []
  }

  const companyNameById = buildCompanyNameById(
    companiesResult.data as { id: unknown; name: unknown; status?: unknown }[] | null
  )

  const rows = (useCasesResult.data ?? []) as Record<string, unknown>[]
  return rows
    .map((row) => rowToUseCaseWithCoords(row, companyNameById))
    .filter(Boolean) as UseCaseWithCoords[]
}

export type GetUseCasesCatalogRowsOptions = {
  includeArchived?: boolean
  publishedOnly?: boolean
}

export async function updateUseCaseStatus(
  id: string,
  status: string,
): Promise<{ ok: boolean; status?: UseCaseStatus; error?: string }> {
  if (!(USE_CASE_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: `Invalid status: ${status}` }
  }
  const supabase = createServiceRoleClient() ?? (await createClient())
  const { error } = await supabase
    .from("AI_Atlas_Use_Cases")
    .update({ status })
    .eq("id", id)
  if (error) {
    console.error("Error updating use case status:", error)
    return { ok: false, error: error.message }
  }
  return { ok: true, status: status as UseCaseStatus }
}

export async function getUseCasesCatalogRows(
  opts: GetUseCasesCatalogRowsOptions = {}
): Promise<UseCaseCatalogRow[]> {
  const { includeArchived = false, publishedOnly = false } = opts
  const supabase =
    createServiceRoleClient() ?? (await createClient())

  // Exclude content — the heaviest column (~1MB for 639 rows). The detail
  // modal lazy-loads it per-row via getUseCaseContent(id).
  let useCasesQuery = supabase
    .from("AI_Atlas_Use_Cases")
    .select("id,company_id,type,title,summary,industry,continent,country,city,latitude,longitude,published_at,status,is_trending,source_name,confidence_score,created_at,\"URL\"")
    .order("id", { ascending: true })

  if (publishedOnly) {
    useCasesQuery = useCasesQuery.eq("status", "published")
  }

  // When not filtering to published, fetch a second range to cover rows
  // beyond Supabase's 1000-row API limit (currently ~1072 total use cases).
  const useCasesPage1 = publishedOnly
    ? null
    : supabase
        .from("AI_Atlas_Use_Cases")
        .select("*")
        .order("id", { ascending: true })
        .range(1000, 1999)

  const [companiesResult, useCasesResult, useCasesOverflow] = await Promise.all([
    supabase.from("AI_Atlas_Companies").select("id, name, status").order("name"),
    useCasesQuery,
    useCasesPage1,
  ])

  if (companiesResult.error) {
    console.error("Error fetching companies for use case labels:", companiesResult.error)
  }

  const companyNameById = buildCompanyNameById(
    companiesResult.data as { id: unknown; name: unknown; status?: unknown }[] | null,
    { includeArchived }
  )

  if (useCasesResult.error) {
    console.error("Error fetching use cases for catalog table:", useCasesResult.error)
    return []
  }

  const rows = [
    ...(useCasesResult.data ?? []),
    ...(useCasesOverflow?.data ?? []),
  ] as Record<string, unknown>[]
  return rows
    .map((row) => rowToUseCaseCatalogRow(row, companyNameById, { includeArchived, publishedOnly }))
    .filter(Boolean) as UseCaseCatalogRow[]
}

export async function getUseCaseCatalogRowById(
  id: string
): Promise<UseCaseCatalogRow | null> {
  const supabase =
    createServiceRoleClient() ?? (await createClient())

  const [companiesResult, useCaseResult] = await Promise.all([
    supabase.from("AI_Atlas_Companies").select("id, name, status").order("name"),
    supabase
      .from("AI_Atlas_Use_Cases")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
  ])

  if (companiesResult.error) {
    console.error("Error fetching companies for use case labels:", companiesResult.error)
  }

  if (useCaseResult.error) {
    console.error("Error fetching use case by id for catalog detail:", useCaseResult.error)
    return null
  }

  if (!useCaseResult.data) return null

  const companyNameById = buildCompanyNameById(
    companiesResult.data as { id: unknown; name: unknown; status?: unknown }[] | null
  )

  return rowToUseCaseCatalogRow(
    useCaseResult.data as Record<string, unknown>,
    companyNameById
  )
}

/** Lazy-load only the content column for a single use case — used by the
  * detail modal to avoid shipping ~1MB of content in the list query. */
export async function getUseCaseContent(
  id: string,
): Promise<string | null> {
  const supabase =
    createServiceRoleClient() ?? (await createClient())

  const { data, error } = await supabase
    .from("AI_Atlas_Use_Cases")
    .select("content")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return null
  const row = data as Record<string, unknown>
  return typeof row.content === "string" ? row.content : null
}

/** Central Europe (legally CET in winter, CEST in summer). */
const CENTRAL_EUROPE_TZ = "Europe/Berlin"

function formatUtcMsAsCentralEurope(ms: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CENTRAL_EUROPE_TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "shortGeneric",
  }).format(new Date(ms))
}

function latestMsFromRows(rows: Record<string, unknown>[]): number | null {
  let max = -Infinity
  for (const row of rows) {
    for (const key of ["updated_at", "created_at"] as const) {
      const v = row[key]
      if (v == null || v === "") continue
      const t = Date.parse(String(v))
      if (Number.isFinite(t) && t > max) max = t
    }
  }
  return max === -Infinity ? null : max
}

async function fetchTimestampRows(
  supabase: SupabaseClient,
  table: string
): Promise<Record<string, unknown>[]> {
  // Try created_at only first — several tables lack updated_at
  const createdOnly = await supabase.from(table).select("created_at")
  if (createdOnly.error) {
    console.error(
      `[getLatestAtlasDataUpdateCetDisplay] ${table}:`,
      createdOnly.error.message
    )
    return []
  }
  return (createdOnly.data ?? []) as Record<string, unknown>[]
}

/**
 * Latest timestamp among all `updated_at` and `created_at` values in
 * `AI_Atlas_Companies` and `AI_Atlas_Use_Cases`, shown in Central European local time
 * (Europe/Berlin).
 */
export async function getLatestAtlasDataUpdateCetDisplay(): Promise<string> {
  const supabase =
    createServiceRoleClient() ?? (await createClient())

  const [companyRows, useCaseRows] = await Promise.all([
    fetchTimestampRows(supabase, "AI_Atlas_Companies"),
    fetchTimestampRows(supabase, "AI_Atlas_Use_Cases"),
  ])

  const mCompanies = latestMsFromRows(companyRows)
  const mUseCases = latestMsFromRows(useCaseRows)
  const candidates = [mCompanies, mUseCases].filter(
    (n): n is number => n != null
  )
  if (candidates.length === 0) return "—"
  const ms = Math.max(...candidates)
  return formatUtcMsAsCentralEurope(ms)
}
