import type { UseCaseCatalogRow } from "@/lib/types"
import { useCaseDisplayName } from "@/lib/types"

// Lifted verbatim out of components/news/news-feed.tsx so the news path can keep
// its Related sidebar without shipping the whole catalog to the browser. The
// copies in components/use-cases/use-cases-table.tsx and app/use-cases/[id]/page.tsx
// are left alone - they run where the rows are already in hand.

export type RelatedUseCase = {
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
  const text = [useCaseDisplayName(row), row.description, row.sector, row.industry]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  const words = text.match(/[a-z0-9]{3,}/g) ?? []
  return new Set(words.filter((word) => !RELATED_STOP_WORDS.has(word)))
}

export function relatedUseCasesFor(
  row: UseCaseCatalogRow,
  rows: UseCaseCatalogRow[],
  limit = 6,
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
