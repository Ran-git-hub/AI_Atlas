"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { SearchBar, type UnifiedSearchHit } from "@/components/search-bar"
import { CompanyDetailPanel } from "@/components/company-detail-panel"
import { UseCaseDetailPanel } from "@/components/use-case-detail-panel"
import { StatsBar } from "@/components/stats-bar"
import { Instructions } from "@/components/instructions"
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
}

export function HomeClient({ companies = [], useCases = [] }: HomeClientProps) {
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithCoords | null>(null)
  const [selectedUseCase, setSelectedUseCase] = useState<UseCaseWithCoords | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [flyTo, setFlyTo] = useState<GlobeFlyTo | null>(null)
  const [flyToNonce, setFlyToNonce] = useState(0)
  const [searchIncludeCompany, setSearchIncludeCompany] = useState(true)
  const [searchIncludeUseCase, setSearchIncludeUseCase] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 280)
    return () => clearTimeout(t)
  }, [searchQuery])

  const safeCompanies = companies || []
  const safeUseCases = useCases || []
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
      for (const c of safeCompanies) {
        if (companyMatchesQuery(c, q)) hits.push({ type: "company", item: c })
      }
    }
    if (searchIncludeUseCase) {
      for (const u of safeUseCases) {
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
    safeCompanies,
    safeUseCases,
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

  const totalCompanies = safeCompanies.length
  const uniqueCountries = new Set(safeCompanies.map(c => c.headquarters_country))
  const totalCountries = uniqueCountries.size
  const uniqueIndustries = new Set(safeCompanies.map(c => c.industry))
  const totalIndustries = uniqueIndustries.size

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
        onIncludeCompanyChange={setSearchIncludeCompany}
        onIncludeUseCaseChange={setSearchIncludeUseCase}
      />

      {/* 3D Globe — z-0 so search UI (higher z-index) always paints above marker glows */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <GlobeView
          companies={safeCompanies}
          useCases={safeUseCases}
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
          selectionRevision={`${selectedCompany?.id ?? "none"}|${selectedUseCase?.id ?? "none"}|${debouncedSearch}|${searchIncludeCompany}|${searchIncludeUseCase}|${detailOpen}`}
        />
      </div>

      {/* Instructions */}
      {showInstructions && <Instructions />}

      {/* Stats bar */}
      <StatsBar 
        totalCompanies={totalCompanies}
        totalCountries={totalCountries}
        totalIndustries={totalIndustries}
        totalUseCases={safeUseCases.length}
      />

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
