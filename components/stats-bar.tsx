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
    <div className="fixed bottom-16 left-1/2 z-30 w-[calc(100%-1rem)] max-w-sm -translate-x-1/2 sm:max-w-xl md:bottom-12 md:w-auto md:max-w-none">
      {/* Mobile layout */}
      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-700/50 bg-slate-900/70 p-3 backdrop-blur-md">
          <button
            type="button"
            onClick={() => onStatClick("companies")}
            className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-2 py-2 text-left transition-colors hover:bg-slate-800/70"
          >
            <Database className="h-4 w-4 shrink-0 text-cyan-400" />
            <span className="min-w-0 truncate whitespace-nowrap text-xs leading-tight text-slate-300">
              <span className="font-semibold tabular-nums text-white">{totalCompanies}</span> Organizations
            </span>
          </button>
          <button
            type="button"
            onClick={() => onStatClick("countries")}
            className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-2 py-2 text-left transition-colors hover:bg-slate-800/70"
          >
            <MapPin className="h-4 w-4 shrink-0 text-cyan-400" />
            <span className="min-w-0 truncate whitespace-nowrap text-xs leading-tight text-slate-300">
              <span className="font-semibold tabular-nums text-white">{totalCountries}</span> Countries/Regions
            </span>
          </button>
          <button
            type="button"
            onClick={() => onStatClick("industries")}
            className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-2 py-2 text-left transition-colors hover:bg-slate-800/70"
          >
            <Layers className="h-4 w-4 shrink-0 text-cyan-400" />
            <span className="min-w-0 truncate whitespace-nowrap text-xs leading-tight text-slate-300">
              <span className="font-semibold tabular-nums text-white">{totalIndustries}</span> Industries
            </span>
          </button>
          <button
            type="button"
            onClick={() => onStatClick("useCases")}
            className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-2 py-2 text-left transition-colors hover:bg-slate-800/70"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-[#3cb371]" />
            <span className="min-w-0 truncate whitespace-nowrap text-xs leading-tight text-slate-300">
              <span className="font-semibold tabular-nums text-white">{totalUseCases}</span>{" "}
              {"Use\u00A0cases"}
            </span>
          </button>
        </div>

      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex">
        <div className="grid w-[min(880px,calc(100vw-2rem))] grid-cols-4 items-stretch rounded-full border border-slate-700/50 bg-slate-900/70 px-4 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={() => onStatClick("companies")}
            className="flex min-w-0 items-center justify-center gap-3 px-3 text-center transition-colors hover:text-cyan-300"
          >
            <Database className="h-4 w-4 shrink-0 text-cyan-400" />
            <span className="flex min-w-0 flex-col items-center justify-center gap-1 leading-tight text-slate-300">
              <span className="text-base font-semibold tabular-nums leading-none text-white">{totalCompanies}</span>
              <span className="min-w-0 text-sm leading-tight">Organizations</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => onStatClick("countries")}
            className="flex min-w-0 items-center justify-center gap-3 border-l border-slate-700/80 px-3 text-center transition-colors hover:text-cyan-300"
          >
            <MapPin className="h-4 w-4 shrink-0 text-cyan-400" />
            <span className="flex min-w-0 flex-col items-center justify-center gap-1 leading-tight text-slate-300">
              <span className="text-base font-semibold tabular-nums leading-none text-white">{totalCountries}</span>
              <span className="min-w-0 text-sm leading-tight">Countries/Regions</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => onStatClick("industries")}
            className="flex min-w-0 items-center justify-center gap-3 border-l border-slate-700/80 px-3 text-center transition-colors hover:text-cyan-300"
          >
            <Layers className="h-4 w-4 shrink-0 text-cyan-400" />
            <span className="flex min-w-0 flex-col items-center justify-center gap-1 leading-tight text-slate-300">
              <span className="text-base font-semibold tabular-nums leading-none text-white">{totalIndustries}</span>
              <span className="text-sm leading-tight">Industries</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => onStatClick("useCases")}
            className="flex min-w-0 items-center justify-center gap-3 border-l border-slate-700/80 px-3 text-center transition-colors hover:text-cyan-300"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-[#3cb371]" />
            <span className="flex min-w-0 flex-col items-center justify-center gap-1 leading-tight text-slate-300">
              <span className="text-base font-semibold tabular-nums leading-none text-white">{totalUseCases}</span>
              <span className="text-sm leading-tight">Use cases</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
