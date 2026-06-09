"use client"

import type { ReactNode } from "react"
import type { NewsItem, NewsTakeContext, NewsTakeReference, NewsTakeUseCase } from "@/lib/types-news"
import { NewsCardImage } from "@/components/news/news-card-image"

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

function formatNewsDate(item: NewsItem): string {
  const iso = item.publishedAt ?? item.createdAt
  if (!iso) return "Date unavailable"

  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "Date unavailable"

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function hostnameFromUrl(url: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
    return parsed.hostname.replace(/^www\./, "")
  } catch {
    return null
  }
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

function truncatePhrase(value: string, max = 88): string {
  const trimmed = value.replace(/\s+/g, " ").trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 3).trim()}...`
}

function topicPhrase(tags: string[]): string {
  const topics = tags.filter(Boolean).slice(0, 3)
  if (topics.length === 0) return "AI deployment"
  if (topics.length === 1) return topics[0]
  return `${topics.slice(0, -1).join(", ")} and ${topics[topics.length - 1]}`
}

function rankUseCases(item: NewsItem, useCases: NewsTakeUseCase[]): NewsTakeUseCase[] {
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

function rankNews(item: NewsItem, news: NewsTakeReference[]): NewsTakeReference[] {
  const itemText = `${item.title} ${item.summary} ${item.tags.join(" ")}`
  const itemTokens = tokenize(itemText)

  return news
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

function useCaseLabel(useCase: NewsTakeUseCase): string {
  const company = useCase.companyName && useCase.companyName !== "Unknown organization" ? `${useCase.companyName}: ` : ""
  return `${company}${useCase.title}`
}

const EMPTY_TAKE_CONTEXT: NewsTakeContext = { useCases: [], news: [] }

function UseCaseTextLink({
  useCase,
  onUseCaseClick,
  children,
}: {
  useCase: NewsTakeUseCase
  onUseCaseClick: (id: string) => void
  children?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onUseCaseClick(useCase.id)
      }}
      className="inline font-semibold text-cyan-300 underline decoration-cyan-400/35 underline-offset-2 transition-colors hover:text-cyan-200 hover:decoration-cyan-300"
    >
      {children ?? truncatePhrase(useCaseLabel(useCase), 76)}
    </button>
  )
}

function dbTakeLinkTargets(take: string, useCases: NewsTakeUseCase[]) {
  const candidates = useCases
    .flatMap((useCase) => {
      const labels = [
        truncatePhrase(useCaseLabel(useCase), 86),
        truncatePhrase(useCaseLabel(useCase), 76),
        truncatePhrase(useCase.title, 86),
        truncatePhrase(useCase.title, 76),
        useCaseLabel(useCase),
        useCase.title,
      ]
      return Array.from(new Set(labels.filter((label) => label && take.includes(label)))).map((label) => ({
        label,
        useCase,
        index: take.indexOf(label),
      }))
    })
    .filter((target) => target.index >= 0)
    .sort((a, b) => a.index - b.index || b.label.length - a.label.length)

  const targets: typeof candidates = []
  for (const candidate of candidates) {
    const candidateEnd = candidate.index + candidate.label.length
    const overlaps = targets.some((target) => {
      const targetEnd = target.index + target.label.length
      return candidate.index < targetEnd && candidateEnd > target.index
    })
    if (!overlaps) targets.push(candidate)
  }

  return targets
}

function LinkedDbTake({
  take,
  takeContext,
  onUseCaseClick,
}: {
  take: string
  takeContext: NewsTakeContext
  onUseCaseClick: (id: string) => void
}) {
  const targets = dbTakeLinkTargets(take, takeContext.useCases)
  const nodes: ReactNode[] = []
  let cursor = 0

  for (const target of targets) {
    const index = target.index
    if (index > cursor) nodes.push(take.slice(cursor, index))
    nodes.push(
      <UseCaseTextLink key={`${target.useCase.id}-${index}`} useCase={target.useCase} onUseCaseClick={onUseCaseClick}>
        {target.label}
      </UseCaseTextLink>,
    )
    cursor = index + target.label.length
  }

  if (cursor < take.length) nodes.push(take.slice(cursor))

  return <>{nodes}</>
}

function AtlasTake({
  item,
  takeContext,
  onUseCaseClick,
}: {
  item: NewsItem
  takeContext: NewsTakeContext
  onUseCaseClick: (id: string) => void
}) {
  if (item.aiAtlasTake.trim()) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
        <strong className="font-semibold text-slate-100">AI Atlas take:</strong>{" "}
        <LinkedDbTake take={item.aiAtlasTake.trim()} takeContext={takeContext} onUseCaseClick={onUseCaseClick} />
      </p>
    )
  }

  const topic = topicPhrase(item.tags)
  const relatedUseCases = rankUseCases(item, takeContext.useCases).slice(0, 2)
  const relatedNews = rankNews(item, takeContext.news).slice(0, 1)

  if (relatedUseCases.length > 0 && relatedNews.length > 0) {
    return (
      <p className="text-sm leading-6 text-slate-300">
        <strong className="font-semibold text-slate-100">AI Atlas take:</strong> This looks like a {topic} signal
        that already has deployment echoes in the atlas, especially{" "}
        <UseCaseTextLink useCase={relatedUseCases[0]} onUseCaseClick={onUseCaseClick} />
        {relatedUseCases[1] ? (
          <>
            {" "}
            and <UseCaseTextLink useCase={relatedUseCases[1]} onUseCaseClick={onUseCaseClick} />
          </>
        ) : null}
        . Read next to "{truncatePhrase(relatedNews[0].title, 86)}", it suggests the same pressure is showing up
        in both market news and implemented use cases.
      </p>
    )
  }

  if (relatedUseCases.length > 0) {
    const primary = relatedUseCases[0]
    return (
      <p className="text-sm leading-6 text-slate-300">
        <strong className="font-semibold text-slate-100">AI Atlas take:</strong> The closest published use-case match
        is <UseCaseTextLink useCase={primary} onUseCaseClick={onUseCaseClick} /> in {primary.industry}. That makes this news worth tracking as a
        deployment signal, not just a company announcement, because it may affect how similar organizations budget,
        govern, or operationalize {topic}.
      </p>
    )
  }

  if (relatedNews.length > 0) {
    return (
      <p className="text-sm leading-6 text-slate-300">
        <strong className="font-semibold text-slate-100">AI Atlas take:</strong> No close published use-case match
        stands out yet, but this connects to recent news such as "{truncatePhrase(relatedNews[0].title, 90)}". For AI
        Atlas, the next test is whether this {topic} signal starts appearing in customer deployments rather than
        remaining a vendor or builder narrative.
      </p>
    )
  }

  return (
    <p className="text-sm leading-6 text-slate-300">
      <strong className="font-semibold text-slate-100">AI Atlas take:</strong> This is an early {topic} signal without
      a strong match in the current published use-case set. Keep it on watch until a concrete deployment, buyer
      pattern, or repeated news signal shows whether it belongs in the atlas as more than a one-off update.
    </p>
  )
}

export function NewsListCard({
  item,
  takeContext = EMPTY_TAKE_CONTEXT,
  onUseCaseClick,
}: {
  item: NewsItem
  takeContext?: NewsTakeContext
  onUseCaseClick: (id: string) => void
}) {
  const source = item.sourceName || hostnameFromUrl(item.url) || "Unknown source"
  const externalUrl = hostnameFromUrl(item.url) ? item.url : null
  const sourceSummary = item.summary.trim() || "No source summary is available for this item yet."
  const textContent = (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
        <span className="break-words text-cyan-400">{source}</span>
        <span className="text-slate-600">·</span>
        <span>{formatNewsDate(item)}</span>
      </div>

      <h3 className="mb-2 text-pretty text-lg font-semibold leading-snug text-[#f5f5f5] transition-colors group-hover:text-cyan-400">
        {item.title}
      </h3>

      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{sourceSummary}</p>

      {item.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span key={tag} className="rounded bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-300">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
  const imageContent = (
    <div className="flex min-w-0 justify-end">
      <NewsCardImage articleUrl={externalUrl} sourceName={source} />
    </div>
  )

  return (
    <article
      className="grid items-center gap-4 rounded-lg border border-slate-700/80 bg-[#181818] px-5 py-4 shadow-[0_0_0_1px_rgba(15,23,42,0.75),0_16px_36px_rgba(0,0,0,0.22)] transition-all hover:border-cyan-500/55 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.2),0_18px_42px_rgba(0,0,0,0.28)]"
      style={{ gridTemplateColumns: "minmax(0, 1fr) clamp(150px, 24%, 220px)" }}
    >
      {externalUrl ? (
        <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="group block min-w-0">
          {textContent}
        </a>
      ) : (
        textContent
      )}

      {externalUrl ? (
        <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="group block min-w-0">
          {imageContent}
        </a>
      ) : (
        imageContent
      )}

      <div className="col-span-full border-t border-slate-800/80 pt-4">
        <AtlasTake item={item} takeContext={takeContext} onUseCaseClick={onUseCaseClick} />
      </div>
    </article>
  )
}
