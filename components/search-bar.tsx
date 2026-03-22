"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Search, SlidersHorizontal, Globe, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { CompanyWithCoords, UseCaseWithCoords } from "@/lib/types"
import { useCaseDisplayName } from "@/lib/types"

export type UnifiedSearchHit =
  | { type: "company"; item: CompanyWithCoords }
  | { type: "use_case"; item: UseCaseWithCoords }

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  results: UnifiedSearchHit[]
  showNoResults: boolean
  onSelectHit: (hit: UnifiedSearchHit) => void
  includeCompany: boolean
  includeUseCase: boolean
  onIncludeCompanyChange: (v: boolean) => void
  onIncludeUseCaseChange: (v: boolean) => void
}

const CYAN = "#22d3ee"
const GREEN = "#3cb371"

function hitLabel(hit: UnifiedSearchHit): string {
  return hit.type === "company"
    ? hit.item.name
    : useCaseDisplayName(hit.item)
}

function hitSubtitle(hit: UnifiedSearchHit): string {
  if (hit.type === "company") {
    return `${hit.item.city}, ${hit.item.headquarters_country}`
  }
  const u = hit.item
  return (
    [u.city, u.country].filter(Boolean).join(", ") ||
    u.location ||
    u.sector ||
    u.industry ||
    "Use case"
  )
}

export function SearchBar({
  value,
  onChange,
  onClear,
  results,
  showNoResults,
  onSelectHit,
  includeCompany,
  includeUseCase,
  onIncludeCompanyChange,
  onIncludeUseCaseChange,
}: SearchBarProps) {
  const [listDismissed, setListDismissed] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const prevValueRef = useRef(value)

  const trimmed = value.trim()
  const showList = trimmed.length > 0 && !listDismissed

  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value
      if (value.trim().length > 0) {
        setListDismissed(false)
      }
    }
  }, [value])

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (rootRef.current?.contains(t)) return
      if (t.closest("[data-company-detail-panel]")) return
      if (t.closest("[data-use-case-detail-panel]")) return
      if (trimmed.length > 0) {
        setListDismissed(true)
      }
    }
    document.addEventListener("mousedown", onDocDown)
    return () => document.removeEventListener("mousedown", onDocDown)
  }, [trimmed.length])

  const handleSelect = useCallback(
    (hit: UnifiedSearchHit) => {
      onSelectHit(hit)
      setListDismissed(true)
    },
    [onSelectHit]
  )

  const toggleCompany = useCallback(
    (checked: boolean) => {
      if (!checked && !includeUseCase) return
      onIncludeCompanyChange(checked)
    },
    [includeUseCase, onIncludeCompanyChange]
  )

  const toggleUseCase = useCallback(
    (checked: boolean) => {
      if (!checked && !includeCompany) return
      onIncludeUseCaseChange(checked)
    },
    [includeCompany, onIncludeUseCaseChange]
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-[20000] p-4 pointer-events-none">
      <div className="flex w-full justify-center px-1 pointer-events-none">
        <div
          ref={rootRef}
          className="flex w-max max-w-full items-center gap-3 sm:gap-4 pointer-events-auto"
        >
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-slate-800/80 backdrop-blur-sm">
              <Globe className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="hidden font-semibold text-white sm:inline whitespace-nowrap">
              AI Atlas
            </span>
          </div>

          <div className="relative z-[20001] min-w-0 w-[clamp(11rem,42vw,36rem)]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setListDismissed(false)}
              onClick={() => {
                if (trimmed.length > 0) setListDismissed(false)
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setListDismissed(true)
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
              className={cn(
                "w-full h-10 pl-10 rounded-lg bg-slate-800/60 backdrop-blur-md border text-white placeholder:text-slate-500",
                "focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all",
                trimmed ? "pr-20" : "pr-4",
                showList ? "border-cyan-500/40 rounded-b-none border-b-0" : "border-slate-700/50"
              )}
              aria-autocomplete="list"
              aria-expanded={showList}
            />
            {trimmed ? (
              <button
                type="button"
                onClick={() => {
                  onClear()
                  setListDismissed(false)
                }}
                className="absolute inset-y-0 right-2 flex items-center justify-center w-8 h-8 my-auto rounded-md text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}

            {showList ? (
              <div
                className="absolute left-0 right-0 top-full z-[20002] rounded-b-lg border border-t-0 border-cyan-500/30 bg-slate-900/95 backdrop-blur-md shadow-lg shadow-black/40 max-h-72 overflow-y-auto"
                role="listbox"
              >
                {showNoResults ? (
                  <div className="px-4 py-3 text-sm text-slate-400">
                    No matching companies or use cases.
                  </div>
                ) : (
                  results.map((hit) => {
                    const isCo = hit.type === "company"
                    return (
                      <button
                        key={`${hit.type}-${hit.item.id}`}
                        type="button"
                        role="option"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelect(hit)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm border-b border-slate-800/80 last:border-0 transition-colors",
                          isCo
                            ? "text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-50"
                            : "text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-50"
                        )}
                      >
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                              style={{
                                color: isCo ? CYAN : GREEN,
                                backgroundColor: isCo
                                  ? "rgba(34, 211, 238, 0.12)"
                                  : "rgba(60, 179, 113, 0.15)",
                                border: `1px solid ${isCo ? "rgba(34,211,238,0.35)" : "rgba(60,179,113,0.4)"}`,
                              }}
                            >
                              {isCo ? "Company" : "Use case"}
                            </span>
                            <span
                              className="font-medium truncate min-w-0"
                              style={{ color: isCo ? CYAN : GREEN }}
                            >
                              {hitLabel(hit)}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 truncate">
                            {hitSubtitle(hit)}
                          </span>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            ) : null}
          </div>

          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "shrink-0 w-11 h-11 rounded-xl bg-slate-800/60 backdrop-blur-md border text-slate-400 hover:bg-slate-800/80",
                  filterOpen || !includeCompany || !includeUseCase
                    ? "border-cyan-500/40 text-cyan-300"
                    : "border-slate-700/50 hover:text-cyan-400 hover:border-cyan-500/50"
                )}
                aria-label="Search scope filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="z-[20003] w-72 border-slate-700 bg-slate-900/95 backdrop-blur-md text-slate-100"
            >
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                Search in
              </p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox
                    checked={includeCompany}
                    onCheckedChange={(v) => toggleCompany(v === true)}
                    className="border-cyan-500/50 data-[state=checked]:bg-cyan-500/20 data-[state=checked]:border-cyan-400 data-[state=checked]:text-cyan-300"
                  />
                  <span className="text-sm text-cyan-300/95 group-hover:text-cyan-200">
                    Company / Organization
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox
                    checked={includeUseCase}
                    onCheckedChange={(v) => toggleUseCase(v === true)}
                    className="border-emerald-500/50 data-[state=checked]:bg-emerald-500/15 data-[state=checked]:border-[#3cb371] data-[state=checked]:text-[#3cb371]"
                  />
                  <span
                    className="text-sm group-hover:opacity-100 opacity-95"
                    style={{ color: GREEN }}
                  >
                    Use case
                  </span>
                </label>
              </div>
              <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                At least one option must stay on. Globe highlights follow the same scope.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  )
}
