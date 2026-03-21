"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { SearchBar } from "@/components/search-bar"
import { CountryDetailPanel } from "@/components/country-detail-panel"
import { StatsBar } from "@/components/stats-bar"
import { Instructions } from "@/components/instructions"
import type { CountryData } from "@/lib/types"

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
  countries: CountryData[]
}

export function HomeClient({ countries }: HomeClientProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)
  
  console.log("[v0] Client: countries received:", countries)

  const handleCountryClick = useCallback((country: CountryData) => {
    setSelectedCountry(country)
    setShowInstructions(false)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedCountry(null)
  }, [])

  // Calculate stats from the data
  const totalCompanies = countries.reduce((sum, c) => sum + c.companies.length, 0)
  const totalCountries = countries.length
  const allIndustries = new Set(countries.flatMap(c => c.companies.map(co => co.industry)))
  const totalIndustries = allIndustries.size

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#020a18]">
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
      <SearchBar />

      {/* 3D Globe */}
      <div className="absolute inset-0">
        <GlobeView countries={countries} onCountryClick={handleCountryClick} />
      </div>

      {/* Instructions */}
      {showInstructions && <Instructions />}

      {/* Stats bar */}
      <StatsBar 
        totalCompanies={totalCompanies}
        totalCountries={totalCountries}
        totalIndustries={totalIndustries}
      />

      {/* Country detail panel */}
      <CountryDetailPanel countryData={selectedCountry} onClose={handleClosePanel} />

      {/* Overlay when panel is open */}
      {selectedCountry && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={handleClosePanel}
        />
      )}
    </main>
  )
}
