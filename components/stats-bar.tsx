"use client"

import { Database, MapPin, Layers, Sparkles } from "lucide-react"

type StatsJumpKind = "companies" | "countries" | "industries" | "useCases"

interface StatsBarProps {
  totalCompanies: number
  totalCountries: number
  totalIndustries: number
  totalUseCases: number
  onStatClick: (kind: StatsJumpKind) => void
}

export function StatsBar({
  totalCompanies,
  totalCountries,
  totalIndustries,
  totalUseCases,
  onStatClick = () => {},
}: StatsBarProps) {
  return (
    <div className="fixed bottom-14 left-1/2 z-30 w-[calc(100%-1rem)] max-w-sm -translate-x-1/2 md:bottom-12 md:w-auto md:max-w-none">
      {/* Mobile layout */}
      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-700/50 bg-slate-900/70 p-3 backdrop-blur-md">
          <button
            type="button"
            onClick={() => onStatClick("companies")}
            className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-2 py-2 text-left transition-colors hover:bg-slate-800/70"
          >
            <Database className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-slate-300">
              <span className="font-semibold text-white">{totalCompanies}</span> Companies
            </span>
          </button>
          <button
            type="button"
            onClick={() => onStatClick("countries")}
            className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-2 py-2 text-left transition-colors hover:bg-slate-800/70"
          >
            <MapPin className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-slate-300">
              <span className="font-semibold text-white">{totalCountries}</span> Countries
            </span>
          </button>
          <button
            type="button"
            onClick={() => onStatClick("industries")}
            className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-2 py-2 text-left transition-colors hover:bg-slate-800/70"
          >
            <Layers className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-slate-300">
              <span className="font-semibold text-white">{totalIndustries}</span> Industries
            </span>
          </button>
          <button
            type="button"
            onClick={() => onStatClick("useCases")}
            className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-2 py-2 text-left transition-colors hover:bg-slate-800/70"
          >
            <Sparkles className="h-4 w-4 text-[#3cb371]" />
            <span className="text-xs text-slate-300">
              <span className="font-semibold text-white">{totalUseCases}</span> Use cases
            </span>
          </button>
        </div>

      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex">
        <div className="flex items-center gap-6 rounded-full border border-slate-700/50 bg-slate-900/70 px-6 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={() => onStatClick("companies")}
            className="flex items-center gap-2 transition-colors hover:text-cyan-300"
          >
            <Database className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-slate-300">
              <span className="font-semibold text-white">{totalCompanies}</span> Companies
            </span>
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <button
            type="button"
            onClick={() => onStatClick("countries")}
            className="flex items-center gap-2 transition-colors hover:text-cyan-300"
          >
            <MapPin className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-slate-300">
              <span className="font-semibold text-white">{totalCountries}</span> Countries
            </span>
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <button
            type="button"
            onClick={() => onStatClick("industries")}
            className="flex items-center gap-2 transition-colors hover:text-cyan-300"
          >
            <Layers className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-slate-300">
              <span className="font-semibold text-white">{totalIndustries}</span> Industries
            </span>
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <button
            type="button"
            onClick={() => onStatClick("useCases")}
            className="flex items-center gap-2 transition-colors hover:text-cyan-300"
          >
            <Sparkles className="h-4 w-4 text-[#3cb371]" />
            <span className="text-sm text-slate-300">
              <span className="font-semibold text-white">{totalUseCases}</span> Use cases
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
