"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { SearchBar, type UnifiedSearchHit } from "@/components/search-bar"
import { CompanyDetailPanel } from "@/components/company-detail-panel"
import { UseCaseDetailPanel } from "@/components/use-case-detail-panel"
import { StatsBar } from "@/components/stats-bar"
import { StatsJumpPanel, type StatsJumpKind } from "@/components/stats-jump-panel"
import { Instructions } from "@/components/instructions"
import { InteractionTips } from "@/components/interaction-tips"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  companyMatchesQuery,
  useCaseMatchesQuery,
} from "@/lib/search-match"
import { useCaseDisplayName, type CompanyWithCoords, type UseCaseWithCoords } from "@/lib/types"
import type { GlobeFlyTo } from "@/components/globe/globe-view"

// Fixed star positions to avoid hydration mismatch
const STAR_POSITIONS = [
  { left: 8.4, top: 12.3, opacity: 0.5, delay: 0.2, duration: 2.5 },
  { left: 23.1, top: 45.7, opacity: 0.7, delay: 1.1, duration: 3.2 },
  { left: 67.8, top: 8.9, opacity: 0.4, delay: 0.8, duration: 2.8 },
  { left: 91.2, top: 34.5, opacity: 0.6, delay: 1.5, duration: 2.3 },
  { left: 45.6, top: 78.2, opacity: 0.8, delay: 0.5, duration: 3.5 },
  { left: 12.9, top: 67.4, opacity: 0.5, delay: 2.1, duration: 2.6 },
  { left: 78.3, top: 23.1, opacity: 0.7, delay: 0.9, duration: 3.1 },
  { left: 34.7, top: 91.5, opacity: 0.4, delay: 1.7, duration: 2.4 },
  { left: 56.2, top: 56.8, opacity: 0.6, delay: 0.3, duration: 2.9 },
  { left: 89.5, top: 67.3, opacity: 0.8, delay: 1.3, duration: 3.3 },
  { left: 3.4, top: 89.1, opacity: 0.5, delay: 2.4, duration: 2.7 },
  { left: 67.1, top: 45.2, opacity: 0.7, delay: 0.6, duration: 3.0 },
  { left: 23.8, top: 12.9, opacity: 0.4, delay: 1.9, duration: 2.2 },
  { left: 78.9, top: 78.4, opacity: 0.6, delay: 0.1, duration: 3.4 },
  { left: 45.3, top: 34.6, opacity: 0.8, delay: 1.2, duration: 2.1 },
  { left: 12.1, top: 23.7, opacity: 0.5, delay: 2.6, duration: 2.8 },
  { left: 56.7, top: 89.3, opacity: 0.7, delay: 0.7, duration: 3.2 },
  { left: 34.2, top: 56.1, opacity: 0.4, delay: 1.4, duration: 2.5 },
  { left: 89.8, top: 12.6, opacity: 0.6, delay: 2.2, duration: 3.1 },
  { left: 1.9, top: 45.9, opacity: 0.8, delay: 0.4, duration: 2.3 },
  { left: 67.4, top: 67.8, opacity: 0.5, delay: 1.6, duration: 2.9 },
  { left: 23.5, top: 78.5, opacity: 0.7, delay: 2.8, duration: 3.3 },
  { left: 78.6, top: 34.2, opacity: 0.4, delay: 0.2, duration: 2.6 },
  { left: 45.9, top: 1.8, opacity: 0.6, delay: 1.8, duration: 3.0 },
  { left: 12.4, top: 91.2, opacity: 0.8, delay: 2.5, duration: 2.4 },
  { left: 91.7, top: 56.4, opacity: 0.5, delay: 0.9, duration: 2.7 },
  { left: 34.9, top: 23.3, opacity: 0.7, delay: 1.1, duration: 3.4 },
  { left: 56.4, top: 45.5, opacity: 0.4, delay: 2.3, duration: 2.2 },
  { left: 3.7, top: 34.8, opacity: 0.6, delay: 0.5, duration: 3.1 },
  { left: 78.2, top: 89.7, opacity: 0.8, delay: 1.7, duration: 2.8 },
  { left: 23.9, top: 56.6, opacity: 0.5, delay: 2.9, duration: 3.2 },
  { left: 67.6, top: 12.1, opacity: 0.7, delay: 0.3, duration: 2.5 },
  { left: 12.7, top: 78.9, opacity: 0.4, delay: 1.3, duration: 2.9 },
  { left: 89.1, top: 45.7, opacity: 0.6, delay: 2.1, duration: 3.3 },
  { left: 45.1, top: 67.2, opacity: 0.8, delay: 0.8, duration: 2.3 },
  { left: 34.4, top: 12.4, opacity: 0.5, delay: 1.5, duration: 3.0 },
  { left: 56.9, top: 34.9, opacity: 0.7, delay: 2.7, duration: 2.6 },
  { left: 1.2, top: 67.1, opacity: 0.4, delay: 0.1, duration: 3.4 },
  { left: 78.7, top: 56.5, opacity: 0.6, delay: 1.9, duration: 2.1 },
  { left: 23.2, top: 89.8, opacity: 0.8, delay: 2.4, duration: 2.7 },
  { left: 67.9, top: 78.1, opacity: 0.5, delay: 0.6, duration: 3.1 },
  { left: 12.3, top: 1.5, opacity: 0.7, delay: 1.2, duration: 2.4 },
  { left: 91.5, top: 23.6, opacity: 0.4, delay: 2.6, duration: 2.8 },
  { left: 45.7, top: 45.3, opacity: 0.6, delay: 0.4, duration: 3.2 },
  { left: 34.1, top: 67.7, opacity: 0.8, delay: 1.8, duration: 2.5 },
  { left: 56.3, top: 12.8, opacity: 0.5, delay: 2.2, duration: 2.9 },
  { left: 3.1, top: 56.2, opacity: 0.7, delay: 0.7, duration: 3.3 },
  { left: 78.4, top: 1.3, opacity: 0.4, delay: 1.4, duration: 2.2 },
  { left: 23.6, top: 34.4, opacity: 0.6, delay: 2.8, duration: 3.0 },
  { left: 67.2, top: 91.6, opacity: 0.8, delay: 0.2, duration: 2.6 },
]

// Dynamic import for Globe to avoid SSR issues
const GlobeView = dynamic(
  () => import("@/components/globe/globe-view").then((mod) => mod.GlobeView),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading Globe...</p>
        </div>
      </div>
    )
  }
)

interface HomeClientProps {
  companies: CompanyWithCoords[]
  useCases: UseCaseWithCoords[]
  /** Preformatted in Central European time (Europe/Berlin) on the server */
  latestDataUpdateCet: string
}

export function HomeClient({
  companies = [],
  useCases = [],
  latestDataUpdateCet,
}: HomeClientProps) {
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithCoords | null>(null)
  const [selectedUseCase, setSelectedUseCase] = useState<UseCaseWithCoords | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [flyTo, setFlyTo] = useState<GlobeFlyTo | null>(null)
  const [flyToNonce, setFlyToNonce] = useState(0)
  const [searchIncludeCompany, setSearchIncludeCompany] = useState(true)
  const [searchIncludeUseCase, setSearchIncludeUseCase] = useState(true)
  const [searchRecentOnly, setSearchRecentOnly] = useState(false)
  const [activeIndustry, setActiveIndustry] = useState<string | null>(null)
  const [statsPanelOpen, setStatsPanelOpen] = useState(false)
  const [statsPanelKind, setStatsPanelKind] = useState<StatsJumpKind>("companies")

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 280)
    return () => clearTimeout(t)
  }, [searchQuery])

  const safeCompanies = companies || []
  const safeUseCases = useCases || []
  const filteredCompanies = useMemo(() => {
    if (!activeIndustry) return safeCompanies
    return safeCompanies.filter((c) => c.industry === activeIndustry)
  }, [safeCompanies, activeIndustry])

  const filteredUseCases = useMemo(() => {
    if (!activeIndustry) return safeUseCases

    const companyIdSet = new Set(filteredCompanies.map((c) => String(c.id)))
    const normalize = (v: string | null | undefined) =>
      (v ?? "").trim().toLowerCase().replace(/\s+/g, " ")
    const companyNameSet = new Set(filteredCompanies.map((c) => normalize(c.name)))

    return safeUseCases.filter((u) => {
      const linkedById =
        u.company_id && companyIdSet.has(String(u.company_id).trim())
      const linkedByName =
        normalize(u.company_name ?? undefined) &&
        companyNameSet.has(normalize(u.company_name ?? undefined))
      return Boolean(linkedById || linkedByName)
    })
  }, [activeIndustry, filteredCompanies, safeUseCases])

  const displayUseCases = useMemo(() => {
    if (!searchRecentOnly) return filteredUseCases
    const now = Date.now()
    return filteredUseCases.filter((u) => {
      const ts = Date.parse(u.updated_at ?? u.created_at ?? "")
      return Number.isFinite(ts) && now - ts <= 24 * 60 * 60 * 1000
    })
  }, [filteredUseCases, searchRecentOnly])

  const industryOptions = useMemo(() => {
    return Array.from(
      safeCompanies.reduce((acc, c) => {
        const key = c.industry?.trim() || "Unknown"
        acc.set(key, (acc.get(key) ?? 0) + 1)
        return acc
      }, new Map<string, number>())
    )
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([industry, count]) => ({ industry, count }))
  }, [safeCompanies])

  const detailOpen = !!(selectedCompany || selectedUseCase)

  const handleCompanyClick = useCallback((company: CompanyWithCoords) => {
    setSelectedUseCase(null)
    setSelectedCompany(company)
    setShowInstructions(false)
  }, [])

  const handleUseCaseClick = useCallback((useCase: UseCaseWithCoords) => {
    setSelectedCompany(null)
    setSelectedUseCase(useCase)
    setShowInstructions(false)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedCompany(null)
    setSelectedUseCase(null)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchQuery("")
    setDebouncedSearch("")
  }, [])

  const searchResults = useMemo(() => {
    if (!debouncedSearch) return []
    const q = debouncedSearch.toLowerCase()
    const hits: UnifiedSearchHit[] = []
    if (searchIncludeCompany) {
      for (const c of filteredCompanies) {
        if (companyMatchesQuery(c, q)) hits.push({ type: "company", item: c })
      }
    }
    if (searchIncludeUseCase) {
      for (const u of displayUseCases) {
        if (useCaseMatchesQuery(u, q)) hits.push({ type: "use_case", item: u })
      }
    }
    hits.sort((a, b) => {
      const la =
        a.type === "company" ? a.item.name : useCaseDisplayName(a.item)
      const lb =
        b.type === "company" ? b.item.name : useCaseDisplayName(b.item)
      return la.localeCompare(lb, undefined, { sensitivity: "base" })
    })
    return hits
  }, [
    debouncedSearch,
    filteredCompanies,
    displayUseCases,
    searchIncludeCompany,
    searchIncludeUseCase,
  ])

  const showSearchNoResults =
    debouncedSearch.length > 0 && searchResults.length === 0

  const handleSearchSelectHit = useCallback((hit: UnifiedSearchHit) => {
    setShowInstructions(false)
    if (hit.type === "company") {
      setSelectedUseCase(null)
      setSelectedCompany(hit.item)
      setFlyTo({ lat: hit.item.lat, lng: hit.item.lng, altitude: 1.85 })
      setFlyToNonce((n) => n + 1)
    } else {
      setSelectedCompany(null)
      setSelectedUseCase(hit.item)
      setFlyTo({ lat: hit.item.lat, lng: hit.item.lng, altitude: 1.85 })
      setFlyToNonce((n) => n + 1)
    }
  }, [])

  const totalCompanies = filteredCompanies.length
  const uniqueCountries = new Set(filteredCompanies.map(c => c.headquarters_country))
  const totalCountries = uniqueCountries.size
  const uniqueIndustries = new Set(filteredCompanies.map(c => c.industry))
  const totalIndustries = uniqueIndustries.size
  const showNoLinkedUseCaseHint =
    Boolean(activeIndustry) &&
    filteredCompanies.length > 0 &&
    displayUseCases.length === 0

  const handleStatsClick = useCallback((kind: StatsJumpKind) => {
    setStatsPanelKind(kind)
    setStatsPanelOpen(true)
  }, [])

  const handleIndustrySelect = useCallback((industry: string | null) => {
    setActiveIndustry(industry)
    setSelectedCompany(null)
    setSelectedUseCase(null)
  }, [])

  const handlePanelCompanySelect = useCallback((company: CompanyWithCoords) => {
    setStatsPanelOpen(false)
    handleCompanyClick(company)
    setFlyTo({ lat: company.lat, lng: company.lng, altitude: 1.85 })
    setFlyToNonce((n) => n + 1)
  }, [handleCompanyClick])

  const handlePanelUseCaseSelect = useCallback((useCase: UseCaseWithCoords) => {
    setStatsPanelOpen(false)
    handleUseCaseClick(useCase)
    setFlyTo({ lat: useCase.lat, lng: useCase.lng, altitude: 1.85 })
    setFlyToNonce((n) => n + 1)
  }, [handleUseCaseClick])

  const handlePanelIndustrySelect = useCallback((industry: string) => {
    setActiveIndustry(industry)
    setStatsPanelOpen(false)
  }, [])

  const handleResetFilters = useCallback(() => {
    setActiveIndustry(null)
    setSearchRecentOnly(false)
    setSelectedCompany(null)
    setSelectedUseCase(null)
    setStatsPanelOpen(false)
  }, [])

  const footerLastUpdated = "2026-03-23"

  return (
    <main className="relative w-full h-screen bg-[#020a18]">
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {STAR_POSITIONS.map((star, i) => (
          <div
            key={i}
            className="absolute w-px h-px bg-white rounded-full animate-pulse"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`
            }}
          />
        ))}
      </div>

      {/* Search bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={handleClearSearch}
        results={searchResults}
        showNoResults={showSearchNoResults}
        onSelectHit={handleSearchSelectHit}
        includeCompany={searchIncludeCompany}
        includeUseCase={searchIncludeUseCase}
        includeRecent24hOnly={searchRecentOnly}
        onIncludeCompanyChange={setSearchIncludeCompany}
        onIncludeUseCaseChange={setSearchIncludeUseCase}
        onIncludeRecent24hOnlyChange={setSearchRecentOnly}
        activeIndustry={activeIndustry}
        industryOptions={industryOptions}
        onIndustrySelect={handleIndustrySelect}
        onResetFilters={handleResetFilters}
      />

      {/* 3D Globe — z-0 so search UI (higher z-index) always paints above marker glows */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <GlobeView
          companies={filteredCompanies}
          useCases={displayUseCases}
          onCompanyClick={handleCompanyClick}
          onUseCaseClick={handleUseCaseClick}
          isPanelOpen={detailOpen}
          highlightSearchQuery={debouncedSearch}
          searchScopeCompany={searchIncludeCompany}
          searchScopeUseCase={searchIncludeUseCase}
          flyTo={flyTo}
          flyToNonce={flyToNonce}
          selectedCompanyId={selectedCompany?.id ?? null}
          selectedUseCaseId={selectedUseCase?.id ?? null}
          selectionRevision={`${selectedCompany?.id ?? "none"}|${selectedUseCase?.id ?? "none"}|${debouncedSearch}|${searchIncludeCompany}|${searchIncludeUseCase}|${searchRecentOnly}|${detailOpen}`}
        />
      </div>

      {/* Interaction tips */}
      <InteractionTips />
      {showInstructions && (
        <div className="md:hidden">
          <Instructions />
        </div>
      )}

      {/* Stats bar */}
      <StatsBar 
        totalCompanies={totalCompanies}
        totalCountries={totalCountries}
        totalIndustries={totalIndustries}
        totalUseCases={displayUseCases.length}
        onStatClick={handleStatsClick}
      />

      {showNoLinkedUseCaseHint && (
        <div className="fixed bottom-36 left-1/2 z-30 -translate-x-1/2 rounded-lg border border-amber-500/30 bg-slate-900/85 px-3 py-2 text-xs text-amber-200 backdrop-blur-md">
          No linked use cases found for this category filter.
        </div>
      )}

      <StatsJumpPanel
        open={statsPanelOpen}
        kind={statsPanelKind}
        companies={filteredCompanies}
        useCases={displayUseCases}
        onOpenChange={setStatsPanelOpen}
        onCompanySelect={handlePanelCompanySelect}
        onUseCaseSelect={handlePanelUseCaseSelect}
        onIndustrySelect={handlePanelIndustrySelect}
      />

      {/* Footer metadata / attribution */}
      <div className="pointer-events-auto fixed bottom-0 left-1/2 z-20 -translate-x-1/2">
        <div className="flex max-w-[calc(100vw-1rem)] flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-2 py-2 text-xs text-slate-300 sm:max-w-none sm:flex-nowrap sm:text-sm">
          <span>Latest Data Update: {latestDataUpdateCet}</span>
          <span className="text-slate-600">|</span>
          <span>© 2026 AI Atlas</span>
          <span className="text-slate-600">|</span>
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="px-1 py-0.5 text-xs text-slate-200 transition-colors hover:text-cyan-300 sm:px-2 sm:py-1 sm:text-sm"
              >
                About
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md border-slate-700 bg-slate-950/95 text-slate-100">
              <DialogHeader>
                <DialogTitle>About AI Atlas</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Data transparency and attribution.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm text-slate-200">
                <p>
                  <span className="font-medium text-slate-100">Data sources:</span>{" "}
                  Company websites, public announcements, and curated AI use-case records.
                </p>
                <p>
                  <span className="font-medium text-slate-100">Method note:</span>{" "}
                  Locations, categories, and links are best-effort and may contain inaccuracies.
                </p>
                <p>
                  <span className="font-medium text-slate-100">Maintainer:</span>{" "}
                  AI Atlas Team
                </p>
                <div className="space-y-1.5 rounded-md border border-slate-800/80 bg-slate-900/70 p-3 text-xs text-slate-400">
                  <p className="font-medium uppercase tracking-wide text-slate-300">
                    Disclaimer
                  </p>
                  <p>
                    Information is provided for reference only and does not constitute
                    professional advice.
                  </p>
                  <p>
                    Data may be incomplete, delayed, or inaccurate; please verify with
                    official sources.
                  </p>
                  <p>
                    Company names, logos, and trademarks belong to their respective owners.
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  Latest Data Update: {latestDataUpdateCet} · © 2026 AI Atlas. All rights
                  reserved.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Company detail panel */}
      {selectedCompany && (
        <CompanyDetailPanel company={selectedCompany} onClose={handleClosePanel} />
      )}

      {selectedUseCase && (
        <UseCaseDetailPanel useCase={selectedUseCase} onClose={handleClosePanel} />
      )}

      {/* Overlay when panel is open */}
      {detailOpen && (
        <div
          className="fixed inset-x-0 bottom-0 top-[var(--app-top-bar-height)] z-[35] bg-black/30 backdrop-blur-sm md:hidden"
          onClick={handleClosePanel}
        />
      )}
    </main>
  )
}
