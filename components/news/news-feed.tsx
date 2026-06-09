"use client"

import { ArrowUp, Search, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { UseCaseCatalogRow } from "@/lib/types"
import { useCaseDisplayName } from "@/lib/types"
import type { NewsItem, NewsTakeContext } from "@/lib/types-news"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NewsListCard } from "@/components/news/news-list-card"
import { UseCaseIndexDetailModalPortal } from "@/components/use-cases/use-case-index-detail-modal"

type SortMode = "newest" | "oldest" | "source"

const PAGE_SIZE_OPTIONS = [20, 50, 100]

function newsTime(item: NewsItem): number {
  const iso = item.publishedAt ?? item.createdAt
  if (!iso) return 0
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function matchesQuery(item: NewsItem, query: string): boolean {
  if (!query) return true
  const haystack = `${item.title} ${item.summary} ${item.sourceName} ${item.tags.join(" ")}`.toLowerCase()
  return haystack.includes(query)
}

function sourceOptions(items: NewsItem[]): string[] {
  return Array.from(new Set(items.map((item) => item.sourceName).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  )
}

function tagOptions(items: NewsItem[]): string[] {
  const tags = new Map<string, string>()
  for (const item of items) {
    for (const tag of item.tags) {
      const key = tag.toLowerCase()
      if (!tags.has(key)) tags.set(key, tag)
    }
  }
  return Array.from(tags.values()).sort((a, b) => a.localeCompare(b))
}

type RelatedUseCase = {
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

function relatedUseCasesFor(row: UseCaseCatalogRow, rows: UseCaseCatalogRow[], limit = 6): RelatedUseCase[] {
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

const EMPTY_TAKE_CONTEXT: NewsTakeContext = { useCases: [], news: [] }

export function NewsFeed({
  items,
  takeContext = EMPTY_TAKE_CONTEXT,
  useCaseRows = [],
}: {
  items: NewsItem[]
  takeContext?: NewsTakeContext
  useCaseRows?: UseCaseCatalogRow[]
}) {
  const [query, setQuery] = useState("")
  const [source, setSource] = useState("all")
  const [tag, setTag] = useState("all")
  const [sort, setSort] = useState<SortMode>("newest")
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [activeDetail, setActiveDetail] = useState<UseCaseCatalogRow | null>(null)
  const [detailHistory, setDetailHistory] = useState<UseCaseCatalogRow[]>([])

  const sources = useMemo(() => sourceOptions(items), [items])
  const tags = useMemo(() => tagOptions(items), [items])
  const queryNorm = normalizeText(query)
  const activeDetailRelated = useMemo(
    () => (activeDetail ? relatedUseCasesFor(activeDetail, useCaseRows) : []),
    [activeDetail, useCaseRows],
  )

  const openUseCaseDetail = async (id: string) => {
    const localRow = useCaseRows.find((row) => row.id === id)
    if (localRow) {
      setDetailHistory([])
      setActiveDetail(localRow)
      return
    }

    const response = await fetch(`/api/use-cases/${encodeURIComponent(id)}`)
    if (!response.ok) return
    const row = (await response.json()) as UseCaseCatalogRow
    setDetailHistory([])
    setActiveDetail(row)
  }

  const openRelatedDetail = (row: UseCaseCatalogRow) => {
    setDetailHistory((history) => (activeDetail ? [...history, activeDetail] : history))
    setActiveDetail(row)
  }

  const goBackInDetail = () => {
    setDetailHistory((history) => {
      const previous = history.at(-1)
      if (!previous) return history
      setActiveDetail(previous)
      return history.slice(0, -1)
    })
  }

  const closeDetail = () => {
    setDetailHistory([])
    setActiveDetail(null)
  }

  const filtered = useMemo(() => {
    const next = items
      .filter((item) => source === "all" || item.sourceName === source)
      .filter((item) => tag === "all" || item.tags.some((itemTag) => itemTag.toLowerCase() === tag))
      .filter((item) => matchesQuery(item, queryNorm))

    next.sort((a, b) => {
      if (sort === "oldest") return newsTime(a) - newsTime(b)
      if (sort === "source") {
        const bySource = a.sourceName.localeCompare(b.sourceName)
        return bySource || newsTime(b) - newsTime(a)
      }
      return newsTime(b) - newsTime(a)
    })

    return next
  }, [items, queryNorm, source, sort, tag])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePageIndex = Math.min(pageIndex, totalPages - 1)
  const pageStart = safePageIndex * pageSize
  const pageEnd = Math.min(pageStart + pageSize, filtered.length)
  const paginated = filtered.slice(pageStart, pageEnd)
  const hasFilters = queryNorm !== "" || source !== "all" || tag !== "all" || sort !== "newest"

  useEffect(() => {
    if (pageIndex > totalPages - 1) setPageIndex(totalPages - 1)
  }, [pageIndex, totalPages])

  useEffect(() => {
    const updateBackToTop = () => setShowBackToTop(window.scrollY > 520)
    updateBackToTop()
    window.addEventListener("scroll", updateBackToTop, { passive: true })
    return () => window.removeEventListener("scroll", updateBackToTop)
  }, [])

  const paginationControls = (withTopBorder = false) =>
    filtered.length > 0 ? (
      <div
        className={`flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between ${
          withTopBorder ? "border-t border-slate-800/80 pt-4" : ""
        }`}
      >
        <p className="text-slate-400">
          Showing {paginated.length} / {filtered.length} filtered news items
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value))
              setPageIndex(0)
            }}
          >
            <SelectTrigger className="h-10 w-[120px] border-slate-800 bg-[#1a1a1a] text-slate-100 focus:ring-cyan-500/20">
              <span className="text-slate-100">{pageSize} / page</span>
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex h-10 min-w-[76px] items-center justify-center rounded-md border border-slate-800 bg-[#1a1a1a] px-3 text-sm font-medium tabular-nums text-slate-100">
            {safePageIndex + 1} / {totalPages}
          </div>

          <button
            type="button"
            onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
            disabled={safePageIndex === 0}
            className="inline-flex h-10 min-w-[84px] items-center justify-center rounded-md border border-slate-800 bg-[#1a1a1a] px-3 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-500/40 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-slate-800 disabled:hover:text-slate-200"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPageIndex((current) => Math.min(totalPages - 1, current + 1))}
            disabled={safePageIndex >= totalPages - 1}
            className="inline-flex h-10 min-w-[84px] items-center justify-center rounded-md border border-slate-800 bg-[#1a1a1a] px-3 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-500/40 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-slate-800 disabled:hover:text-slate-200"
          >
            Next
          </button>
        </div>
      </div>
    ) : null

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 text-slate-600">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h2 className="mb-1 text-lg font-semibold text-[#f5f5f5]">No news yet</h2>
        <p className="max-w-sm text-xs text-slate-400">
          News will appear here once OpenClaw starts publishing records to the database.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-4 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPageIndex(0)
            }}
            placeholder="Search title, summary, source, or tag"
            className="border-slate-800 bg-[#1a1a1a] pl-11 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-500/60 focus-visible:ring-cyan-500/20"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={source}
            onValueChange={(value) => {
              setSource(value)
              setPageIndex(0)
            }}
          >
            <SelectTrigger className="w-full border-slate-800 bg-[#1a1a1a] text-slate-100 focus:ring-cyan-500/20 sm:w-[170px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
              <SelectItem value="all">All sources</SelectItem>
              {sources.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={tag}
            onValueChange={(value) => {
              setTag(value)
              setPageIndex(0)
            }}
          >
            <SelectTrigger className="w-full border-slate-800 bg-[#1a1a1a] text-slate-100 focus:ring-cyan-500/20 sm:w-[150px]">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
              <SelectItem value="all">All tags</SelectItem>
              {tags.map((name) => (
                <SelectItem key={name} value={name.toLowerCase()}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value as SortMode)
              setPageIndex(0)
            }}
          >
            <SelectTrigger className="w-full border-slate-800 bg-[#1a1a1a] text-slate-100 focus:ring-cyan-500/20 sm:w-[150px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-950 text-slate-100">
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="source">By source</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters ? (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setSource("all")
                setTag("all")
                setSort("newest")
                setPageIndex(0)
              }}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-800 bg-[#1a1a1a] px-3 text-sm font-medium text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
            >
              <X className="h-4 w-4" />
              Reset
            </button>
          ) : null}
        </div>
      </div>

      {paginationControls()}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-[#1a1a1a] px-5 py-10 text-center">
          <h2 className="mb-1 text-base font-semibold text-[#f5f5f5]">No matching news</h2>
          <p className="text-sm text-slate-400">Try another source or search term.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {paginated.map((item) => (
            <NewsListCard key={item.id} item={item} takeContext={takeContext} onUseCaseClick={openUseCaseDetail} />
          ))}
        </div>
      )}

      {paginationControls(true)}

      {activeDetail ? (
        <UseCaseIndexDetailModalPortal
          detail={activeDetail}
          relatedUseCases={activeDetailRelated}
          onRelatedUseCaseClick={openRelatedDetail}
          onBack={goBackInDetail}
          canGoBack={detailHistory.length > 0}
          onClose={closeDetail}
        />
      ) : null}

      {showBackToTop && !activeDetail ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-[min(calc(100vw-5.75rem),calc(50%+28rem+0.75rem))] z-40 inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-cyan-500/35 bg-[#101820]/95 px-3 text-xs font-semibold text-cyan-200 shadow-[0_14px_36px_rgba(0,0,0,0.35)] transition-colors hover:border-cyan-400/70 hover:bg-[#13222b] hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/45"
          aria-label="Back to top"
          title="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
          Top
        </button>
      ) : null}
    </div>
  )
}
