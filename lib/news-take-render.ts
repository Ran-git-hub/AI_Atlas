import type { UseCaseCatalogRow } from "@/lib/types"
import { useCaseDisplayName } from "@/lib/types"
import type { NewsItem, NewsTakeFallback, NewsTakeLink, NewsTakeRender } from "@/lib/types-news"

// This work used to run in the browser: /news shipped all 685 published catalog
// rows plus a projection of them, 1.07 MB of the page, so that every card could
// linkify case names inside its take and score a fallback take when the pipeline
// left one empty. Both inputs are fixed and known on the server, so only the
// results need to travel - see buildTakeRenders at the bottom.

const TAKE_STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "across",
  "also",
  "among",
  "and",
  "are",
  "artificial",
  "because",
  "before",
  "being",
  "between",
  "builders",
  "captured",
  "company",
  "companies",
  "could",
  "for",
  "follow",
  "from",
  "global",
  "has",
  "have",
  "intelligence",
  "into",
  "news",
  "not",
  "more",
  "over",
  "post",
  "rather",
  "shared",
  "source",
  "their",
  "there",
  "these",
  "this",
  "those",
  "through",
  "time",
  "under",
  "update",
  "use",
  "used",
  "uses",
  "using",
  "was",
  "while",
  "will",
  "with",
  "would",
  "you",
  "your",
])

/** Still used by the card when rendering a fallback take. */
export function truncatePhrase(value: string, max = 88): string {
  const trimmed = value.replace(/\s+/g, " ").trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 3).trim()}...`
}

/** Still used by the card when rendering a fallback take. */
export function topicPhrase(tags: string[]): string {
  const topics = tags.filter(Boolean).slice(0, 3)
  if (topics.length === 0) return "AI deployment"
  if (topics.length === 1) return topics[0]
  return `${topics.slice(0, -1).join(", ")} and ${topics[topics.length - 1]}`
}

function tokenize(value: string): Set<string> {
  const words = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !TAKE_STOPWORDS.has(word))

  return new Set(words)
}

function sharedTokenScore(tokens: Set<string>, text: string): number {
  const candidateTokens = tokenize(text)
  let score = 0
  for (const token of tokens) {
    if (candidateTokens.has(token)) score += 1
  }
  return score
}

function tagScore(tags: string[], text: string): number {
  const haystack = text.toLowerCase()
  return tags.reduce((score, tag) => {
    const normalized = tag.trim().toLowerCase()
    if (!normalized) return score
    return haystack.includes(normalized) ? score + 3 : score
  }, 0)
}

type TakeUseCase = {
  id: string
  title: string
  companyName: string
  industry: string
  description: string
}

function useCaseLabel(useCase: TakeUseCase): string {
  const company = useCase.companyName && useCase.companyName !== "Unknown organization" ? `${useCase.companyName}: ` : ""
  return `${company}${useCase.title}`
}

function projectUseCase(row: UseCaseCatalogRow): TakeUseCase {
  return {
    id: row.id,
    title: useCaseDisplayName(row),
    companyName: row.company_name?.trim() || "Unknown organization",
    industry: row.industry?.trim() || row.sector?.trim() || "Uncategorized",
    description: row.description?.trim() || "",
  }
}

type LabelCandidate = { label: string; useCase: TakeUseCase }

// The six label variants per case that a take might contain. Built once for the
// whole feed rather than per item: the 685 x 6 array is identical every time,
// and rebuilding it 500 times was most of the cost of doing this server-side.
function buildLabelCandidates(useCases: TakeUseCase[]): LabelCandidate[] {
  const candidates: LabelCandidate[] = []
  for (const useCase of useCases) {
    const labels = new Set(
      [
        truncatePhrase(useCaseLabel(useCase), 86),
        truncatePhrase(useCaseLabel(useCase), 76),
        truncatePhrase(useCase.title, 86),
        truncatePhrase(useCase.title, 76),
        useCaseLabel(useCase),
        useCase.title,
      ].filter(Boolean),
    )
    for (const label of labels) candidates.push({ label, useCase })
  }
  return candidates
}

function takeLinks(take: string, candidates: LabelCandidate[]): NewsTakeLink[] {
  const matches = candidates
    .filter((candidate) => take.includes(candidate.label))
    .map((candidate) => ({
      id: candidate.useCase.id,
      index: take.indexOf(candidate.label),
      length: candidate.label.length,
    }))
    .sort((a, b) => a.index - b.index || b.length - a.length)

  const links: NewsTakeLink[] = []
  for (const match of matches) {
    const matchEnd = match.index + match.length
    const overlaps = links.some((link) => match.index < link.index + link.length && matchEnd > link.index)
    if (!overlaps) links.push(match)
  }

  return links
}

function rankUseCases(item: NewsItem, useCases: TakeUseCase[]): TakeUseCase[] {
  const itemText = `${item.title} ${item.summary} ${item.tags.join(" ")}`
  const itemTokens = tokenize(itemText)

  return useCases
    .map((useCase) => {
      const text = `${useCase.title} ${useCase.companyName} ${useCase.industry} ${useCase.description}`
      return {
        useCase,
        score: sharedTokenScore(itemTokens, text) + tagScore(item.tags, text),
      }
    })
    .filter((entry) => entry.score > 3)
    .sort((a, b) => b.score - a.score || a.useCase.title.localeCompare(b.useCase.title))
    .map((entry) => entry.useCase)
}

function rankNews(item: NewsItem, items: NewsItem[]): NewsItem[] {
  const itemText = `${item.title} ${item.summary} ${item.tags.join(" ")}`
  const itemTokens = tokenize(itemText)

  return items
    .filter((reference) => reference.id !== item.id)
    .map((reference) => {
      const text = `${reference.title} ${reference.summary} ${reference.sourceName} ${reference.tags.join(" ")}`
      return {
        reference,
        score: sharedTokenScore(itemTokens, text) + tagScore(item.tags, text),
      }
    })
    .filter((entry) => entry.score > 3)
    .sort((a, b) => b.score - a.score || a.reference.title.localeCompare(b.reference.title))
    .map((entry) => entry.reference)
}

function fallbackFor(item: NewsItem, useCases: TakeUseCase[], items: NewsItem[]): NewsTakeFallback {
  return {
    topic: topicPhrase(item.tags),
    useCases: rankUseCases(item, useCases)
      .slice(0, 2)
      .map((useCase) => ({
        id: useCase.id,
        label: truncatePhrase(useCaseLabel(useCase), 76),
        industry: useCase.industry,
      })),
    newsTitles: rankNews(item, items)
      .slice(0, 1)
      .map((reference) => reference.title),
  }
}

/**
 * One entry per news item: where the case links go inside its take, or the
 * ingredients of the generated take when the pipeline left one empty.
 *
 * `rows` must already be filtered to published cases - the client used to
 * receive a pre-filtered array, and dropping the filter here would start
 * surfacing pending cases in takes and in the modal's Related sidebar.
 */
export function buildTakeRenders(items: NewsItem[], rows: UseCaseCatalogRow[]): Record<string, NewsTakeRender> {
  const useCases = rows.map(projectUseCase)
  const candidates = buildLabelCandidates(useCases)

  const renders: Record<string, NewsTakeRender> = {}
  for (const item of items) {
    const take = item.aiAtlasTake.trim()
    renders[item.id] = take
      ? { links: takeLinks(take, candidates), fallback: null }
      : { links: [], fallback: fallbackFor(item, useCases, items) }
  }
  return renders
}
