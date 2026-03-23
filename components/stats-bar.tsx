"use client"

import { Database, MapPin, Layers, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type StatsJumpKind = "companies" | "countries" | "industries" | "useCases"

interface StatsBarProps {
  totalCompanies: number
  totalCountries: number
  totalIndustries: number
  totalUseCases: number
  activeIndustry: string | null
  industryOptions: Array<{ industry: string; count: number }>
  onIndustrySelect: (industry: string | null) => void
  onStatClick: (kind: StatsJumpKind) => void
  onResetFilters: () => void
}

export function StatsBar({
  totalCompanies,
  totalCountries,
  totalIndustries,
  totalUseCases,
  activeIndustry,
  industryOptions = [],
  onIndustrySelect = () => {},
  onStatClick = () => {},
  onResetFilters = () => {},
}: StatsBarProps) {
  const quickIndustries = industryOptions.slice(0, 6)
  const showReset = Boolean(activeIndustry)
  const filterChipClass =
    "shrink-0 rounded-full border px-2.5 py-1 text-sm transition-colors"
  const filterStripClass =
    "overflow-x-auto rounded-full border border-cyan-500/25 bg-slate-900/75 px-3 py-2 backdrop-blur-md [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-500/40 [&::-webkit-scrollbar-track]:bg-slate-800/35 [&::-webkit-scrollbar]:h-1.5"

  return (
    <div className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-1rem)] max-w-sm -translate-x-1/2 md:w-auto md:max-w-none">
      {/* Mobile layout */}
      <div className="space-y-2 md:hidden">
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

        <div className="relative">
          <div
            className={filterStripClass}
            style={{ scrollbarColor: "rgba(34,211,238,0.45) rgba(30,41,59,0.35)" }}
          >
            <div className="mx-auto flex min-w-max items-center justify-center gap-2">
            {showReset && (
              <button
                type="button"
                onClick={onResetFilters}
                className="shrink-0 rounded-full border border-rose-400/45 bg-rose-500/10 px-2.5 py-1 text-sm text-rose-200 transition-colors hover:bg-rose-500/20"
              >
                Reset
              </button>
            )}
              <button
                type="button"
                onClick={() => onIndustrySelect(null)}
                className={cn(
                  filterChipClass,
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
                    filterChipClass,
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
      </div>

      {/* Desktop layout */}
      <div className="hidden flex-col items-center gap-2 md:flex">
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

        <div className="relative w-[min(46rem,76vw)]">
          <div
            className={cn(filterStripClass, "w-full")}
            style={{ scrollbarColor: "rgba(34,211,238,0.45) rgba(30,41,59,0.35)" }}
          >
            <div className="mx-auto flex min-w-max items-center justify-center gap-2">
              {showReset && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="shrink-0 rounded-full border border-rose-400/45 bg-rose-500/10 px-2.5 py-1 text-sm text-rose-200 transition-colors hover:bg-rose-500/20"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => onIndustrySelect(null)}
                className={cn(
                  filterChipClass,
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
                    filterChipClass,
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
      </div>
    </div>
  )
}
