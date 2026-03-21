"use client"

import { X, ExternalLink, MapPin, Building2, Globe2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CountryData, Company } from "@/lib/types"
import Image from "next/image"

interface CountryDetailPanelProps {
  countryData: CountryData | null
  onClose: () => void
}

function CompanyCard({ company }: { company: Company }) {
  return (
    <a
      href={company.website_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 hover:bg-slate-800/70 transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-700/50 border border-slate-600/50 flex items-center justify-center overflow-hidden">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={`${company.name} logo`}
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
                ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <Building2 className={`h-6 w-6 text-slate-500 ${company.logo_url ? 'hidden' : ''}`} />
        </div>

        {/* Company Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-sm truncate group-hover:text-cyan-400 transition-colors">
              {company.name}
            </h3>
            <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
          </div>
          
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {company.industry}
          </span>
          
          <p className="mt-2 text-slate-400 text-xs leading-relaxed line-clamp-2">
            {company.description}
          </p>
        </div>
      </div>
    </a>
  )
}

export function CountryDetailPanel({ countryData, onClose }: CountryDetailPanelProps) {
  if (!countryData) return null

  const industries = [...new Set(countryData.companies.map(c => c.industry))]

  return (
    <div
      className={`fixed right-0 top-0 h-full w-full max-w-md transform transition-transform duration-500 ease-out z-50 ${
        countryData ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Glassmorphism panel */}
      <div className="h-full m-4 rounded-2xl overflow-hidden backdrop-blur-xl bg-slate-900/80 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 flex flex-col">
        {/* Header */}
        <div className="relative flex-shrink-0">
          {/* Gradient header background */}
          <div className="h-32 bg-gradient-to-br from-cyan-500/20 via-slate-900 to-slate-900 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,211,238,0.1),transparent_40%)]" />
            
            {/* Globe icon */}
            <div className="absolute bottom-4 left-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center backdrop-blur-sm">
                <Globe2 className="h-7 w-7 text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900/70 text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-white text-balance">{countryData.country}</h2>
            <div className="flex items-center gap-2 mt-2 text-slate-400">
              <MapPin className="h-4 w-4 text-cyan-400" />
              <span className="text-sm">
                {countryData.companies.length} AI {countryData.companies.length === 1 ? 'Company' : 'Companies'}
              </span>
            </div>
          </div>

          {/* Industry tags */}
          <div className="flex flex-wrap gap-2">
            {industries.map((industry) => (
              <span
                key={industry}
                className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50"
              >
                {industry}
              </span>
            ))}
          </div>

          {/* Companies list */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Companies
            </h3>
            <div className="space-y-3">
              {countryData.companies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom glow effect */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}
