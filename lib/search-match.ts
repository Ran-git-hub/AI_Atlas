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
    // These replace the fieldEntries values the globe payload used to carry.
    // Everything else in that list was a duplicate of a field already above it;
    // the two that were not are type and continent. created_at and the source
    // URL are no longer searchable, which nobody searches by.
    u.type,
    u.continent,
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
