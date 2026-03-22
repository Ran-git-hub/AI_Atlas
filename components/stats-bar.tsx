"use client"

import { Database, MapPin, Layers, Sparkles } from "lucide-react"

interface StatsBarProps {
  totalCompanies: number
  totalCountries: number
  totalIndustries: number
  totalUseCases: number
}

export function StatsBar({
  totalCompanies,
  totalCountries,
  totalIndustries,
  totalUseCases,
}: StatsBarProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
      <div className="flex items-center gap-6 px-6 py-3 rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-700/50">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-cyan-400" />
          <span className="text-sm text-slate-300">
            <span className="font-semibold text-white">{totalCompanies}</span> Companies
          </span>
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-cyan-400" />
          <span className="text-sm text-slate-300">
            <span className="font-semibold text-white">{totalCountries}</span> Countries
          </span>
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <span className="text-sm text-slate-300">
            <span className="font-semibold text-white">{totalIndustries}</span> Industries
          </span>
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#3cb371]" />
          <span className="text-sm text-slate-300">
            <span className="font-semibold text-white">{totalUseCases}</span> Use cases
          </span>
        </div>
      </div>
    </div>
  )
}
