import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import {
  Company,
  CompanyWithCoords,
  CITY_COORDINATES,
  type UseCaseFieldEntry,
  UseCaseWithCoords,
} from "./types"

export async function getCompanies(): Promise<Company[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("AI_Atlas_Companies")
    .select("*")
    .order("name")
  
  if (error) {
    console.error("Error fetching companies:", error)
    return []
  }
  
  return data || []
}

export async function getCompaniesWithCoords(): Promise<CompanyWithCoords[]> {
  const companies = await getCompanies()
  
  return companies.map(company => {
    const coords = CITY_COORDINATES[company.city] || { lat: 0, lng: 0 }
    return {
      ...company,
      lat: coords.lat,
      lng: coords.lng
    }
  })
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("AI_Atlas_Companies")
    .select("*")
    .eq("id", id)
    .single()
  
  if (error) {
    console.error("Error fetching company:", error)
    return null
  }
  
  return data
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
  "lat",
  "lng",
])

function normalizeUseCaseFieldKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, "_")
}

function buildCompanyNameById(
  rows: { id: unknown; name: unknown }[] | null
): Map<string, string> {
  const map = new Map<string, string>()
  for (const r of rows ?? []) {
    if (r.id === null || r.id === undefined) continue
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
  return Object.keys(row)
    .filter((key) => !HIDDEN_USE_CASE_DETAIL_KEYS.has(normalizeUseCaseFieldKey(key)))
    .sort((a, b) => a.localeCompare(b))
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

  const lat = pickCoord(row, ["lat", "latitude", "Lat", "Latitude"])
  const lng = pickCoord(row, ["lng", "longitude", "lon", "Lng", "Longitude"])
  if (lat === null || lng === null) return null

  const str = (v: unknown) =>
    v === null || v === undefined ? null : String(v)

  return {
    id: String(id),
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
    lat,
    lng,
    fieldEntries: buildUseCaseFieldEntries(row, companyNameById),
  }
}

export async function getUseCasesWithCoords(): Promise<UseCaseWithCoords[]> {
  // Prefer service role on the server so reads work even when RLS has no policy yet.
  // For production, prefer fixing RLS (see supabase/migrations) and you may omit the service key.
  const supabase =
    createServiceRoleClient() ?? (await createClient())

  const [companiesResult, useCasesResult] = await Promise.all([
    supabase.from("AI_Atlas_Companies").select("id, name").order("name"),
    supabase
      .from("AI_Atlas_Use_Cases")
      .select("*")
      .order("id", { ascending: true }),
  ])

  if (companiesResult.error) {
    console.error("Error fetching companies for use case labels:", companiesResult.error)
  }

  const companyNameById = buildCompanyNameById(
    companiesResult.data as { id: unknown; name: unknown }[] | null
  )

  if (useCasesResult.error) {
    console.error("Error fetching use cases:", useCasesResult.error)
    return []
  }

  const rows = (useCasesResult.data ?? []) as Record<string, unknown>[]
  return rows
    .map((row) => rowToUseCaseWithCoords(row, companyNameById))
    .filter(Boolean) as UseCaseWithCoords[]
}
