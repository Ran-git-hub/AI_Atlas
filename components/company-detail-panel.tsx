"use client"

import { useEffect, useMemo, useState } from "react"
import { X, ExternalLink, MapPin, Building2, Calendar, Layers } from "lucide-react"
import type { CompanyWithCoords, UseCaseWithCoords } from "@/lib/types"
import { useCaseDisplayName } from "@/lib/types"
import { getGoogleFaviconUrl } from "@/lib/company-logo"
import { USE_CASE_PANEL_ACCENT } from "@/lib/use-case-panel-accent"
import { cn } from "@/lib/utils"

function normalizeOrgName(v: string | null | undefined): string {
  return (v ?? "").trim().toLowerCase().replace(/\s+/g, " ")
}

function relatedUseCasesForCompany(
  company: CompanyWithCoords,
  useCases: UseCaseWithCoords[]
): UseCaseWithCoords[] {
  const id = String(company.id).trim()
  const nameKey = normalizeOrgName(company.name)
  const filtered = useCases.filter((u) => {
    if (u.company_id && String(u.company_id).trim() === id) return true
    const un = normalizeOrgName(u.company_name ?? undefined)
    return Boolean(nameKey && un && un === nameKey)
  })
  return filtered.sort((a, b) => {
    const ma = Date.parse(a.updated_at ?? a.created_at ?? "")
    const mb = Date.parse(b.updated_at ?? b.created_at ?? "")
    const ta = Number.isFinite(ma) ? ma : 0
    const tb = Number.isFinite(mb) ? mb : 0
    return tb - ta
  })
}

function useCaseSummaryText(u: UseCaseWithCoords): string {
  const d = u.description?.trim()
  return d || "—"
}

function formatCompanyDateEn(iso: string): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return iso
  return new Date(t).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/** Related use case card: show footer only when `updated_at` exists (same rule as company row). */
function useCaseUpdatedFooterLine(u: UseCaseWithCoords): string | null {
  const raw = u.updated_at?.trim()
  if (!raw) return null
  return `Updated: ${formatCompanyDateEn(raw)}`
}

interface CompanyDetailPanelProps {
  company: CompanyWithCoords
  /** Full catalog (not globe-filtered) so the panel lists every case for this organization. */
  useCases: UseCaseWithCoords[]
  onClose: () => void
  onRelatedUseCaseClick?: (useCase: UseCaseWithCoords) => void
}

export function CompanyDetailPanel({
  company,
  useCases,
  onClose,
  onRelatedUseCaseClick,
}: CompanyDetailPanelProps) {
  const [faviconError, setFaviconError] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const faviconUrl = getGoogleFaviconUrl(company.website_url)

  useEffect(() => {
    setFaviconError(false)
    setLogoError(false)
  }, [company.id, company.website_url, company.logo_url])

  const relatedUseCases = useMemo(
    () => relatedUseCasesForCompany(company, useCases),
    [company, useCases]
  )

  const companyUpdatedAt = company.updated_at?.trim() ?? ""

  return (
    <div
      data-company-detail-panel
      className="fixed right-0 top-[var(--app-top-bar-height)] bottom-0 w-full max-w-md z-40 animate-in slide-in-from-right duration-300"
    >
      <div className="flex h-full flex-col overflow-hidden border-l border-cyan-500/20 bg-slate-900/85 backdrop-blur-xl">
        <div className="detail-panel-scroll min-h-0 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-cyan-500/10">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-semibold text-white">Organization Details</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800/80 transition-colors text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Company Logo and Name */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {faviconUrl && !faviconError ? (
                <img
                  src={faviconUrl}
                  alt={company.name}
                  className="w-full h-full object-contain rounded-md bg-white/95 p-2"
                  onError={() => setFaviconError(true)}
                />
              ) : company.logo_url && !logoError ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-full h-full object-contain p-2"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Building2 className="h-8 w-8 text-slate-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white truncate">{company.name}</h3>
              <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-sm">
                <MapPin className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                <span>{company.city}, {company.headquarters_country}</span>
              </div>
            </div>
          </div>

          {/* Category badge */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {company.industry}
            </span>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">About</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {company.description}
            </p>
          </div>

          {/* Related use cases (newest first by updated_at, else created_at) */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-slate-500">
              <Layers className="h-3.5 w-3.5 text-cyan-400/80" aria-hidden />
              Related use cases
            </h4>
            {relatedUseCases.length === 0 ? (
              <p className="text-sm text-slate-500">
                No use cases linked to this organization in the dataset.
              </p>
            ) : (
              <ul className="space-y-2">
                {relatedUseCases.map((uc) => {
                  const dateLine = useCaseUpdatedFooterLine(uc)
                  const interactive = Boolean(onRelatedUseCaseClick)
                  const cardClass = cn(
                    "group w-full rounded-lg border border-slate-700/60 bg-slate-800/40 p-3 text-left transition-colors",
                    interactive &&
                      "cursor-pointer hover:border-cyan-500/35 hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
                  )
                  const inner = (
                    <>
                      <span
                        className="block text-base font-bold leading-snug underline decoration-2 underline-offset-[2px]"
                        style={{
                          color: USE_CASE_PANEL_ACCENT,
                          textDecorationColor: USE_CASE_PANEL_ACCENT,
                        }}
                      >
                        {useCaseDisplayName(uc)}
                      </span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-slate-400">
                        {useCaseSummaryText(uc)}
                      </span>
                      {dateLine ? (
                        <span className="mt-2 block text-xs text-slate-600">{dateLine}</span>
                      ) : null}
                    </>
                  )
                  return (
                    <li key={uc.id}>
                      {interactive ? (
                        <button
                          type="button"
                          className={cardClass}
                          onClick={() => onRelatedUseCaseClick?.(uc)}
                        >
                          {inner}
                        </button>
                      ) : (
                        <div className={cardClass}>{inner}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>Location</span>
              </div>
              <p className="text-white text-sm font-medium">{company.city}</p>
              <p className="text-slate-400 text-xs">{company.headquarters_country}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Building2 className="h-3.5 w-3.5" />
                <span>Category</span>
              </div>
              <p className="text-white text-sm font-medium">{company.industry}</p>
            </div>
          </div>

          {/* Only when the company row has updated_at from the DB */}
          {companyUpdatedAt ? (
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              <span>Updated: {formatCompanyDateEn(companyUpdatedAt)}</span>
            </div>
          ) : null}

          {/* Website Link */}
          {company.website_url && (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-medium transition-all duration-200 hover:border-cyan-500/50"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Visit Website</span>
            </a>
          )}

          {/* Coordinates (Debug/Info) */}
          <div className="pt-4 border-t border-slate-700/50">
            <p className="text-slate-600 text-xs">
              Coordinates: {company.lat.toFixed(4)}, {company.lng.toFixed(4)}
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
