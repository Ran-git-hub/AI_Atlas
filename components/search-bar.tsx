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
import { getGoogleFaviconUrl } from "@/lib/company-logo"

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
  activeIndustry: string | null
  industryOptions: Array<{ industry: string; count: number }>
  onIndustrySelect: (industry: string | null) => void
  onResetFilters: () => void
}

const CYAN = "#22d3ee"
const GREEN = "#3cb371"
const RECENT_HITS_STORAGE_KEY = "ai-atlas:recent-search-hits:v1"
const MAX_RECENT_HITS = 5

function TechLobsterIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Futuristic robot antenna */}
      <path d="M12 3.1v2.1" />
      <circle cx="12" cy="2.2" r="0.9" />
      {/* Robot head shell */}
      <rect x="5" y="6.2" width="14" height="10.8" rx="3.2" />
      {/* Visor */}
      <rect x="7.5" y="9" width="9" height="4.2" rx="2.1" />
      {/* Eyes */}
      <circle cx="10.1" cy="11.1" r="0.85" />
      <circle cx="13.9" cy="11.1" r="0.85" />
      {/* Side modules */}
      <path d="M5 10.5H3.4" />
      <path d="M20.6 10.5H19" />
      {/* Neck / base */}
      <path d="M9.2 17.2v2.1" />
      <path d="M14.8 17.2v2.1" />
      <path d="M8.2 20.2h7.6" />
    </svg>
  )
}

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
  activeIndustry,
  industryOptions = [],
  onIndustrySelect,
  onResetFilters,
}: SearchBarProps) {
  const [listDismissed, setListDismissed] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [recentHits, setRecentHits] = useState<UnifiedSearchHit[]>([])
  const [brokenCompanyImages, setBrokenCompanyImages] = useState<Record<string, string>>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const prevValueRef = useRef(value)

  const trimmed = value.trim()
  const showList = trimmed.length > 0 && !listDismissed
  const showRecentList = inputFocused && trimmed.length === 0 && recentHits.length > 0
  const showIndustryFilter = false

  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value
      if (value.trim().length > 0) {
        setListDismissed(false)
      }
    }
  }, [value])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_HITS_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return
      const valid = parsed.filter(
        (v): v is UnifiedSearchHit =>
          v &&
          (v.type === "company" || v.type === "use_case") &&
          v.item &&
          (typeof v.item.id === "string" || typeof v.item.id === "number")
      )
      setRecentHits(valid.slice(0, MAX_RECENT_HITS))
    } catch {
      // Ignore malformed localStorage payloads.
    }
  }, [])

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (rootRef.current?.contains(t)) return
      if (t.closest("[data-company-detail-panel]")) return
      if (t.closest("[data-use-case-detail-panel]")) return
      if (trimmed.length > 0) {
        setListDismissed(true)
      }
      setSearchExpanded(false)
      setInputFocused(false)
    }
    document.addEventListener("mousedown", onDocDown)
    return () => document.removeEventListener("mousedown", onDocDown)
  }, [trimmed.length])

  const handleSelect = useCallback(
    (hit: UnifiedSearchHit) => {
      onSelectHit(hit)
      setListDismissed(true)
      setInputFocused(false)
      setRecentHits((prev) => {
        const key = `${hit.type}:${String(hit.item.id)}`
        const next = [hit, ...prev.filter((h) => `${h.type}:${String(h.item.id)}` !== key)].slice(
          0,
          MAX_RECENT_HITS
        )
        try {
          localStorage.setItem(RECENT_HITS_STORAGE_KEY, JSON.stringify(next))
        } catch {
          // Ignore localStorage write errors.
        }
        return next
      })
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

  const markCompanyImageBroken = useCallback((companyId: string, src: string) => {
    setBrokenCompanyImages((prev) => {
      const key = `${companyId}:${src}`
      if (prev[key]) return prev
      return { ...prev, [key]: "1" }
    })
  }, [])

  const isCompanyImageBroken = useCallback(
    (companyId: string, src: string) => Boolean(brokenCompanyImages[`${companyId}:${src}`]),
    [brokenCompanyImages]
  )
  const quickIndustries = industryOptions.slice(0, 6)
  const showReset = Boolean(activeIndustry)

  return (
    <header className="fixed top-0 left-0 right-0 z-[20000] p-4 pointer-events-none">
      <div className="flex w-full justify-center px-1 pointer-events-none">
        <div ref={rootRef} className="flex w-full max-w-[min(94vw,52rem)] flex-col gap-1.5 pointer-events-auto">
          <div className="flex w-full items-center gap-3 sm:gap-4">
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800/60 backdrop-blur-sm">
                <TechLobsterIcon className="h-[1.72rem] w-[1.72rem] text-cyan-300" />
              </div>
              <span className="hidden font-semibold text-white sm:inline whitespace-nowrap">
                AI Atlas
              </span>
            </div>

            <div className="relative z-[20001] min-w-0 w-[clamp(11rem,46vw,38rem)] rounded-xl p-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Search className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onFocus={() => {
                    setInputFocused(true)
                    setListDismissed(false)
                    setSearchExpanded(true)
                  }}
                  onClick={() => {
                    setSearchExpanded(true)
                    if (trimmed.length > 0) setListDismissed(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setListDismissed(true)
                      setSearchExpanded(false)
                      setInputFocused(false)
                      ;(e.target as HTMLInputElement).blur()
                    }
                  }}
                  className={cn(
                    "w-full h-10 pl-10 rounded-lg bg-slate-800/55 border border-slate-700/50 text-white placeholder:text-slate-500",
                    "focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all",
                    trimmed ? "pr-20" : "pr-4",
                    showList || showRecentList ? "border-cyan-500/40 rounded-b-none border-b-0" : ""
                  )}
                  aria-autocomplete="list"
                  aria-expanded={showList || showRecentList}
                  onBlur={() => setInputFocused(false)}
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

                {showList || showRecentList ? (
                  <div
                    className="absolute left-0 right-0 top-full z-[20002] rounded-b-lg border border-t-0 border-cyan-500/30 bg-slate-900/95 backdrop-blur-md shadow-lg shadow-black/40"
                    role="listbox"
                  >
                    <div className="max-h-60 overflow-y-auto">
                      {showRecentList ? (
                        <>
                          <div className="flex items-center justify-between px-4 pt-3 pb-1">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                              Recent
                            </span>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setRecentHits([])
                                try {
                                  localStorage.removeItem(RECENT_HITS_STORAGE_KEY)
                                } catch {
                                  // Ignore localStorage write errors.
                                }
                              }}
                              className="text-[11px] text-slate-400 transition-colors hover:text-cyan-300"
                            >
                              Clear
                            </button>
                          </div>
                          {recentHits.map((hit) => {
                            const isCo = hit.type === "company"
                            const company = isCo ? hit.item : null
                            const companyId = company ? String(company.id) : ""
                            const faviconSrc = company ? getGoogleFaviconUrl(company.website_url) : ""
                            const logoSrc = company?.logo_url?.trim() || ""
                            const showFavicon =
                              Boolean(faviconSrc) && !isCompanyImageBroken(companyId, faviconSrc)
                            const showLegacyLogo =
                              !showFavicon && Boolean(logoSrc) && !isCompanyImageBroken(companyId, logoSrc)
                            return (
                              <button
                                key={`recent-${hit.type}-${hit.item.id}`}
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
                                <div className="flex items-center gap-3 min-w-0">
                                  {isCo ? (
                                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md border border-slate-700/70 bg-slate-800/80 flex items-center justify-center">
                                      {showFavicon ? (
                                        <img
                                          src={faviconSrc}
                                          alt={company?.name ?? "Company logo"}
                                          className="w-full h-full rounded-sm bg-white/95 object-contain p-1"
                                          onError={() => {
                                            if (companyId) markCompanyImageBroken(companyId, faviconSrc)
                                          }}
                                        />
                                      ) : showLegacyLogo ? (
                                        <img
                                          src={logoSrc}
                                          alt={company?.name ?? "Company logo"}
                                          className="w-full h-full object-contain p-1"
                                          onError={() => {
                                            if (companyId) markCompanyImageBroken(companyId, logoSrc)
                                          }}
                                        />
                                      ) : (
                                        <Globe className="h-4 w-4 text-slate-500" />
                                      )}
                                    </div>
                                  ) : null}
                                  <div className="flex flex-col gap-1 min-w-0 flex-1">
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
                                </div>
                              </button>
                            )
                          })}
                        </>
                      ) : showNoResults ? (
                        <div className="px-4 py-3 text-sm text-slate-400">
                          No matching companies or use cases.
                        </div>
                      ) : (
                        results.map((hit) => {
                        const isCo = hit.type === "company"
                        const company = isCo ? hit.item : null
                        const companyId = company ? String(company.id) : ""
                        const faviconSrc = company ? getGoogleFaviconUrl(company.website_url) : ""
                        const logoSrc = company?.logo_url?.trim() || ""
                        const showFavicon =
                          Boolean(faviconSrc) && !isCompanyImageBroken(companyId, faviconSrc)
                        const showLegacyLogo =
                          !showFavicon &&
                          Boolean(logoSrc) &&
                          !isCompanyImageBroken(companyId, logoSrc)
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
                              <div className="flex items-center gap-3 min-w-0">
                                {isCo ? (
                                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md border border-slate-700/70 bg-slate-800/80 flex items-center justify-center">
                                    {showFavicon ? (
                                      <img
                                        src={faviconSrc}
                                        alt={company?.name ?? "Company logo"}
                                        className="w-full h-full rounded-sm bg-white/95 object-contain p-1"
                                        onError={() => {
                                          if (companyId) markCompanyImageBroken(companyId, faviconSrc)
                                        }}
                                      />
                                    ) : showLegacyLogo ? (
                                      <img
                                        src={logoSrc}
                                        alt={company?.name ?? "Company logo"}
                                        className="w-full h-full object-contain p-1"
                                        onError={() => {
                                          if (companyId) markCompanyImageBroken(companyId, logoSrc)
                                        }}
                                      />
                                    ) : (
                                      <Globe className="h-4 w-4 text-slate-500" />
                                    )}
                                  </div>
                                ) : null}
                                <div className="flex flex-col gap-1 min-w-0 flex-1">
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
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>

                    {showIndustryFilter && (
                      <div className="border-t border-slate-700/60 px-2.5 py-2">
                        <div
                          className="overflow-x-auto rounded-full border border-cyan-500/25 bg-slate-900/70 px-2.5 py-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-500/40 [&::-webkit-scrollbar-track]:bg-slate-800/35 [&::-webkit-scrollbar]:h-1.5"
                          style={{ scrollbarColor: "rgba(34,211,238,0.45) rgba(30,41,59,0.35)" }}
                        >
                          <div className="mx-auto flex min-w-max items-center justify-center gap-1.5 sm:gap-2">
                            {showReset && (
                              <button
                                type="button"
                                onClick={onResetFilters}
                                className="shrink-0 rounded-full border border-rose-400/45 bg-rose-500/10 px-2 py-1 text-xs text-rose-200 transition-colors hover:bg-rose-500/20 sm:px-2.5 sm:text-sm"
                              >
                                Reset
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onIndustrySelect(null)}
                              className={cn(
                                "shrink-0 rounded-full border px-2 py-1 text-xs transition-colors sm:px-2.5 sm:text-sm",
                                !activeIndustry
                                  ? "border-cyan-400/70 bg-cyan-500/20 text-cyan-200"
                                  : "border-slate-600/70 bg-slate-800/70 text-slate-300 hover:text-cyan-300"
                              )}
                            >
                              All
                            </button>
                            {quickIndustries.map((entry) => (
                              <button
                                key={entry.industry}
                                type="button"
                                onClick={() => onIndustrySelect(entry.industry)}
                                className={cn(
                                  "shrink-0 rounded-full border px-2 py-1 text-xs transition-colors sm:px-2.5 sm:text-sm",
                                  activeIndustry === entry.industry
                                    ? "border-cyan-400/70 bg-cyan-500/20 text-cyan-200"
                                    : "border-slate-600/70 bg-slate-800/70 text-slate-300 hover:text-cyan-300"
                                )}
                              >
                                {entry.industry} ({entry.count})
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                    Search in
                  </p>
                  <div className="space-y-3">
                    <label className="group flex cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={includeCompany}
                        onCheckedChange={(v) => toggleCompany(v === true)}
                        className="border-cyan-500/50 data-[state=checked]:border-cyan-400 data-[state=checked]:bg-cyan-500/20 data-[state=checked]:text-cyan-300"
                      />
                      <span className="text-sm text-cyan-300/95 group-hover:text-cyan-200">
                        Company / Organization
                      </span>
                    </label>
                    <label className="group flex cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={includeUseCase}
                        onCheckedChange={(v) => toggleUseCase(v === true)}
                        className="border-emerald-500/50 data-[state=checked]:border-[#3cb371] data-[state=checked]:bg-emerald-500/15 data-[state=checked]:text-[#3cb371]"
                      />
                      <span className="text-sm opacity-95 group-hover:opacity-100" style={{ color: GREEN }}>
                        Use case
                      </span>
                    </label>
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                    At least one option must stay on. Globe highlights follow the same scope.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
