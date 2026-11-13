"use client"

import { useRef, useState, type ReactNode } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

const COLLAPSE_ABOVE = 15

export function UseCaseIndexShell({
  total,
  title,
  description,
  children,
}: {
  total: number
  title: string
  description: string
  children: ReactNode
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState("")
  const [shown, setShown] = useState(total)
  const [expanded, setExpanded] = useState(false)

  const applyFilter = (value: string) => {
    setQuery(value)
    const needle = value.trim().toLowerCase()
    let count = 0
    listRef.current?.querySelectorAll("li").forEach((item) => {
      const match = !needle || (item.textContent ?? "").toLowerCase().includes(needle)
      item.hidden = !match
      if (match) count += 1
    })
    setShown(count)
  }

  const filtering = query.trim() !== ""
  const collapsible = total > COLLAPSE_ABOVE
  const collapsed = collapsible && !expanded && !filtering

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-[#f5f5f5]">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {filtering ? `${shown.toLocaleString()} of ${total.toLocaleString()} use cases match.` : description}
          </p>
        </div>
        {collapsible ? (
          <label className="relative block w-full shrink-0 sm:w-72">
            <span className="sr-only">Filter use cases</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(event) => applyFilter(event.target.value)}
              placeholder="Filter by organization or keyword"
              className="h-10 w-full rounded-lg border border-slate-800 bg-[#121212] pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-[#43cc93]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43cc93]/30"
            />
          </label>
        ) : null}
      </div>

      <div ref={listRef} className={cn("relative mt-4", collapsed && "max-h-[32rem] overflow-hidden")}>
        {children}
        {collapsed ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
        ) : null}
      </div>

      {filtering && shown === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No use cases match this filter.</p>
      ) : null}

      {collapsible && !filtering ? (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex h-10 items-center rounded-lg border border-[#43cc93]/35 bg-[#43cc93]/10 px-4 text-sm font-medium text-[#43cc93] transition-colors hover:border-[#43cc93]/60 hover:bg-[#43cc93]/15 hover:text-[#7ee2b5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43cc93]/60"
          >
            {expanded ? "Show fewer" : `Show all ${total.toLocaleString()} use cases`}
          </button>
        </div>
      ) : null}
    </>
  )
}
