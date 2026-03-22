import type { CompanyWithCoords, UseCaseWithCoords } from "@/lib/types"
import { useCaseDisplayName } from "@/lib/types"

function norm(s: string | null | undefined): string {
  return String(s ?? "")
    .toLowerCase()
    .trim()
}

/** Lowercased haystack for company search (substring match). */
export function companySearchHaystack(c: CompanyWithCoords): string {
  return [
    c.name,
    c.description,
    c.industry,
    c.city,
    c.headquarters_country,
  ]
    .map(norm)
    .filter(Boolean)
    .join(" ")
}

/** Lowercased haystack for use case search (substring match). */
export function useCaseSearchHaystack(u: UseCaseWithCoords): string {
  const parts = [
    useCaseDisplayName(u),
    u.description,
    u.sector,
    u.industry,
    u.city,
    u.country,
    u.location,
    u.company_name,
    ...u.fieldEntries.map((e) => e.value),
  ]
  return parts.map(norm).filter(Boolean).join(" ")
}

export function companyMatchesQuery(
  c: CompanyWithCoords,
  queryLower: string
): boolean {
  if (!queryLower) return true
  return companySearchHaystack(c).includes(queryLower)
}

export function useCaseMatchesQuery(
  u: UseCaseWithCoords,
  queryLower: string
): boolean {
  if (!queryLower) return true
  return useCaseSearchHaystack(u).includes(queryLower)
}
