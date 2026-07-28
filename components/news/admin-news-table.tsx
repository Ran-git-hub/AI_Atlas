"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  X,
} from "lucide-react"
import type { NewsItem } from "@/lib/types-news"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const STATUSES = ["published", "pending", "noise"] as const
const PAGE_SIZES = [20, 50, 100] as const

function StatusCell({ id, value }: { id: string; value: string }) {
  const router = useRouter()
  const [current, setCurrent] = useState(value)

  async function handleChange(next: string) {
    if (next === current) return
    const prev = current
    setCurrent(next)
    try {
      const res = await fetch(`/api/admin/news/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      const data = await res.json().catch(() => ({})) as {
        ok?: boolean
        error?: string
      }
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`)
      toast({ title: "Status updated", description: `Set to "${next}".` })
      router.refresh()
    } catch (err) {
      setCurrent(prev)
      toast({
        title: "Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const color =
    current === "published"
      ? "text-green-400"
      : current === "pending"
        ? "text-yellow-400"
        : "text-red-400"

  return (
    <Select value={current || ""} onValueChange={handleChange}>
      <SelectTrigger
        aria-label="Change status"
        className={`h-7 w-[120px] border-white/15 bg-[#181818] text-xs ${color}`}
      >
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent className="border-white/15 bg-[#181818] text-[#f5f5f5]">
        {STATUSES.map((s) => (
          <SelectItem
            key={s}
            value={s}
            className="text-xs focus:bg-slate-800 focus:text-white"
          >
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function formatDate(v: string | null | undefined): string {
  if (!v) return "—"
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toISOString().slice(0, 10)
}

export function AdminNewsTable({ items }: { items: NewsItem[] }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [sourceFilter, setSourceFilter] = useState<string[]>([])

  // Derive unique sources from items
  const allSources = useMemo(() => {
    const set = new Set<string>()
    for (const item of items) {
      if (item.sourceName) set.add(item.sourceName)
    }
    return Array.from(set).sort()
  }, [items])

  // Apply filters
  const filtered = useMemo(() => {
    let result = items
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.sourceName.toLowerCase().includes(q),
      )
    }
    if (statusFilter.length > 0) {
      result = result.filter((item) =>
        statusFilter.includes(item.status ?? ""),
      )
    }
    if (sourceFilter.length > 0) {
      result = result.filter((item) => sourceFilter.includes(item.sourceName))
    }
    return result
  }, [items, search, statusFilter, sourceFilter])

  // Reset page when filters change
  const displayItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  // Safe page clamp
  if (page > totalPages) {
    // useEffect would be better but we use this for simplicity
    setTimeout(() => setPage(totalPages), 0)
  }

  const published = items.filter((i) => i.status === "published").length
  const pending = items.filter((i) => i.status === "pending").length
  const noise = items.filter((i) => i.status === "noise").length
  const uncategorized = items.filter((i) => !i.status).length
  const activeFilters = (search ? 1 : 0) + statusFilter.length + sourceFilter.length

  function clearFilters() {
    setSearch("")
    setStatusFilter([])
    setSourceFilter([])
    setPage(1)
  }

  return (
    <div>
      {/* Summary bar */}
      <div className="mb-4 flex flex-wrap gap-3 text-xs">
        <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-green-400">
          {published} published
        </span>
        <span className="rounded-full bg-yellow-500/15 px-2.5 py-1 text-yellow-400">
          {pending} pending
        </span>
        <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-red-400">
          {noise} noise
        </span>
        <span className="rounded-full bg-slate-500/15 px-2.5 py-1 text-slate-400">
          {uncategorized} uncategorized
        </span>
        <span className="rounded-full bg-slate-500/15 px-2.5 py-1 text-slate-400">
          {items.length} total
        </span>
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555]" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search news title, summary, or source…"
            className="h-9 w-full rounded-full border-[#2f2f2f] bg-[#1c1c1c] pl-9 pr-4 text-sm text-[#f5f5f5] placeholder:text-[#555] sm:max-w-[400px]"
          />
        </div>
        <div className="flex gap-2">
          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 rounded-full border-[#2f2f2f] bg-[#1c1c1c] px-3 text-xs text-[#f5f5f5]"
              >
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                {statusFilter.length > 0
                  ? `${statusFilter.length} status`
                  : "Status"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-[#2f2f2f] bg-[#181818] text-[#f5f5f5]">
              <DropdownMenuCheckboxItem
                checked={statusFilter.length === 0}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => setStatusFilter([])}
                className="text-xs focus:bg-slate-800"
              >
                All statuses
              </DropdownMenuCheckboxItem>
              {STATUSES.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={statusFilter.includes(s)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(checked) => {
                    setStatusFilter((prev) =>
                      checked ? [...prev, s] : prev.filter((v) => v !== s),
                    )
                    setPage(1)
                  }}
                  className="text-xs capitalize focus:bg-slate-800"
                >
                  {s}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Source filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 rounded-full border-[#2f2f2f] bg-[#1c1c1c] px-3 text-xs text-[#f5f5f5]"
              >
                <Filter className="mr-1.5 h-3.5 w-3.5" />
                {sourceFilter.length > 0
                  ? `${sourceFilter.length} source`
                  : "Source"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[400px] overflow-y-auto border-[#2f2f2f] bg-[#181818] text-[#f5f5f5]">
              <DropdownMenuCheckboxItem
                checked={sourceFilter.length === 0}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => setSourceFilter([])}
                className="text-xs focus:bg-slate-800"
              >
                All sources
              </DropdownMenuCheckboxItem>
              {allSources.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={sourceFilter.includes(s)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(checked) => {
                    setSourceFilter((prev) =>
                      checked ? [...prev, s] : prev.filter((v) => v !== s),
                    )
                    setPage(1)
                  }}
                  className="text-xs focus:bg-slate-800"
                >
                  {s}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear */}
          {activeFilters > 0 ? (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="h-9 rounded-full border-[#2f2f2f] bg-[#1c1c1c] px-3 text-xs text-[#8a8a8a] hover:text-[#f5f5f5]"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters > 0 ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {search.trim() ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-[#d0d0d0]">
              Search: "{search.trim()}"
              <button
                onClick={() => setSearch("")}
                className="ml-0.5 rounded-full p-0.5 text-[#8a8a8a] hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ) : null}
          {statusFilter.map((s) => (
            <span
              key={`s-${s}`}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs capitalize text-[#d0d0d0]"
            >
              Status: {s}
              <button
                onClick={() => {
                  setStatusFilter((prev) => prev.filter((v) => v !== s))
                  setPage(1)
                }}
                className="ml-0.5 rounded-full p-0.5 text-[#8a8a8a] hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {sourceFilter.map((s) => (
            <span
              key={`src-${s}`}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-[#d0d0d0]"
            >
              {s}
              <button
                onClick={() => {
                  setSourceFilter((prev) => prev.filter((v) => v !== s))
                  setPage(1)
                }}
                className="ml-0.5 rounded-full p-0.5 text-[#8a8a8a] hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#2f2f2f] bg-[#181818]">
        <table className="w-full text-sm">
          <thead className="border-b border-[#2f2f2f] bg-[#0f0f0f]/80">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-[#8a8a8a]">
                Status
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-[#8a8a8a]">
                Title
              </th>
              <th className="hidden px-3 py-2.5 text-left text-xs font-medium text-[#8a8a8a] md:table-cell">
                Source
              </th>
              <th className="hidden whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-[#8a8a8a] lg:table-cell">
                Published
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2f2f2f]">
            {displayItems.map((item) => (
              <tr key={item.id} className="hover:bg-white/[0.03]">
                <td className="px-3 py-2">
                  <StatusCell id={item.id} value={item.status ?? ""} />
                </td>
                <td className="max-w-[300px] px-3 py-2">
                  <a
                    href={item.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="line-clamp-2 text-[#f5f5f5] hover:text-cyan-300"
                  >
                    {item.title}
                  </a>
                </td>
                <td className="hidden px-3 py-2 text-[#8a8a8a] md:table-cell">
                  {item.sourceName}
                </td>
                <td className="hidden whitespace-nowrap px-3 py-2 text-[#8a8a8a] lg:table-cell">
                  {formatDate(item.publishedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#8a8a8a]">
          Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–
          {Math.min(page * pageSize, filtered.length)} of {filtered.length}
          {filtered.length !== items.length
            ? ` (filtered from ${items.length})`
            : ""}
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v))
              setPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[110px] border-white/15 bg-[#181818] text-xs text-[#f5f5f5]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/15 bg-[#181818] text-[#f5f5f5]">
              {PAGE_SIZES.map((s) => (
                <SelectItem
                  key={s}
                  value={String(s)}
                  className="text-xs focus:bg-slate-800 focus:text-white"
                >
                  {s} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 border-white/15 bg-[#181818] text-[#f5f5f5]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex h-8 min-w-[48px] items-center justify-center rounded-md border border-white/15 bg-[#181818] px-2 text-xs tabular-nums text-[#f5f5f5]">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 border-white/15 bg-[#181818] text-[#f5f5f5]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
