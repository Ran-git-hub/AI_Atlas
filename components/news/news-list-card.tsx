"use client"

import { useState, type ReactNode } from "react"
import type { NewsItem, NewsTakeLink, NewsTakeRender } from "@/lib/types-news"
import { topicPhrase, truncatePhrase } from "@/lib/news-take-render"
import { NewsCardImage } from "@/components/news/news-card-image"

import { formatAtlasDate } from "@/lib/format-date"
function formatNewsDate(item: NewsItem): string {
  const iso = item.createdAt ?? item.publishedAt
  if (!iso) return "Date unavailable"

  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "Date unavailable"

  return formatAtlasDate(d)
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

function UseCaseTextLink({
  id,
  label,
  onUseCaseClick,
  children,
}: {
  id: string
  label: string
  onUseCaseClick: (id: string) => void | Promise<void>
  children?: ReactNode
}) {
  // The row is no longer on the page - opening one is a fetch now, so the click
  // needs acknowledging or the link reads as dead for the round trip.
  const [pending, setPending] = useState(false)

  const openUseCase = async () => {
    if (pending) return
    setPending(true)
    try {
      await onUseCaseClick(id)
    } finally {
      setPending(false)
    }
  }

  return (
    <span
      role="button"
      tabIndex={0}
      aria-busy={pending}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void openUseCase()
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        event.stopPropagation()
        void openUseCase()
      }}
      className={`inline whitespace-normal break-words text-left align-baseline font-semibold leading-[inherit] text-cyan-300 underline decoration-cyan-400/35 underline-offset-2 transition-colors hover:text-cyan-200 hover:decoration-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 ${
        pending ? "cursor-wait opacity-60" : "cursor-pointer"
      }`}
      style={{ overflowWrap: "anywhere" }}
    >
      {children ?? label}
    </span>
  )
}

function LinkedDbTake({
  take,
  links,
  onUseCaseClick,
}: {
  take: string
  links: NewsTakeLink[]
  onUseCaseClick: (id: string) => void | Promise<void>
}) {
  const nodes: ReactNode[] = []
  let cursor = 0

  for (const link of links) {
    if (link.index > cursor) nodes.push(take.slice(cursor, link.index))
    const label = take.slice(link.index, link.index + link.length)
    nodes.push(
      <UseCaseTextLink key={`${link.id}-${link.index}`} id={link.id} label={label} onUseCaseClick={onUseCaseClick}>
        {label}
      </UseCaseTextLink>,
    )
    cursor = link.index + link.length
  }

  if (cursor < take.length) nodes.push(take.slice(cursor))

  return <>{nodes}</>
}

function AtlasTake({
  item,
  render,
  onUseCaseClick,
}: {
  item: NewsItem
  render?: NewsTakeRender
  onUseCaseClick: (id: string) => void | Promise<void>
}) {
  if (item.aiAtlasTake.trim()) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
        <strong className="font-semibold text-slate-100">AI Atlas take:</strong>{" "}
        <LinkedDbTake take={item.aiAtlasTake.trim()} links={render?.links ?? []} onUseCaseClick={onUseCaseClick} />
      </p>
    )
  }

  const fallback = render?.fallback
  const topic = fallback?.topic ?? topicPhrase(item.tags)
  const relatedUseCases = fallback?.useCases ?? []
  const relatedNews = fallback?.newsTitles ?? []

  if (relatedUseCases.length > 0 && relatedNews.length > 0) {
    return (
      <p className="text-sm leading-6 text-slate-300">
        <strong className="font-semibold text-slate-100">AI Atlas take:</strong> This looks like a {topic} signal
        that already has deployment echoes in the atlas, especially{" "}
        <UseCaseTextLink id={relatedUseCases[0].id} label={relatedUseCases[0].label} onUseCaseClick={onUseCaseClick} />
        {relatedUseCases[1] ? (
          <>
            {" "}
            and <UseCaseTextLink id={relatedUseCases[1].id} label={relatedUseCases[1].label} onUseCaseClick={onUseCaseClick} />
          </>
        ) : null}
        . Read next to "{truncatePhrase(relatedNews[0], 86)}", it suggests the same pressure is showing up
        in both market news and implemented use cases.
      </p>
    )
  }

  if (relatedUseCases.length > 0) {
    const primary = relatedUseCases[0]
    return (
      <p className="text-sm leading-6 text-slate-300">
        <strong className="font-semibold text-slate-100">AI Atlas take:</strong> The closest published use-case match
        is <UseCaseTextLink id={primary.id} label={primary.label} onUseCaseClick={onUseCaseClick} /> in {primary.industry}. That makes this news worth tracking as a
        deployment signal, not just a company announcement, because it may affect how similar organizations budget,
        govern, or operationalize {topic}.
      </p>
    )
  }

  if (relatedNews.length > 0) {
    return (
      <p className="text-sm leading-6 text-slate-300">
        <strong className="font-semibold text-slate-100">AI Atlas take:</strong> No close published use-case match
        stands out yet, but this connects to recent news such as "{truncatePhrase(relatedNews[0], 90)}". For AI
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
  render,
  onUseCaseClick,
  onTagClick,
}: {
  item: NewsItem
  render?: NewsTakeRender
  onUseCaseClick: (id: string) => void | Promise<void>
  onTagClick: (tag: string) => void
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
    </div>
  )
  const tagsContent =
    item.tags.length > 0 ? (
      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onTagClick(tag)}
            className="rounded bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
          >
            {tag}
          </button>
        ))}
      </div>
    ) : null
  const imageContent = (
    <div className="flex min-w-0 justify-start sm:justify-end">
      <NewsCardImage articleUrl={externalUrl} sourceName={source} />
    </div>
  )

  return (
    <article
      className="grid items-center gap-4 rounded-lg border border-slate-700/80 bg-[#181818] px-5 py-4 shadow-[0_0_0_1px_rgba(15,23,42,0.75),0_16px_36px_rgba(0,0,0,0.22)] transition-all hover:border-cyan-500/55 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.2),0_18px_42px_rgba(0,0,0,0.28)] sm:grid-cols-[minmax(0,1fr)_clamp(150px,24%,220px)]"
    >
      <div className="min-w-0">
        {externalUrl ? (
          <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="group block min-w-0">
            {textContent}
          </a>
        ) : (
          textContent
        )}
        {tagsContent}
      </div>

      {externalUrl ? (
        <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="group block min-w-0">
          {imageContent}
        </a>
      ) : (
        imageContent
      )}

      <div className="col-span-full border-t border-slate-800/80 pt-4">
        <AtlasTake item={item} render={render} onUseCaseClick={onUseCaseClick} />
      </div>
    </article>
  )
}
