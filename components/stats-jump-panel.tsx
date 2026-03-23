"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { CompanyWithCoords, UseCaseWithCoords } from "@/lib/types"
import { useCaseDisplayName } from "@/lib/types"

export type StatsJumpKind = "companies" | "countries" | "industries" | "useCases"

interface StatsJumpPanelProps {
  open: boolean
  kind: StatsJumpKind
  companies: CompanyWithCoords[]
  useCases: UseCaseWithCoords[]
  onOpenChange: (open: boolean) => void
  onCompanySelect: (company: CompanyWithCoords) => void
  onUseCaseSelect: (useCase: UseCaseWithCoords) => void
  onIndustrySelect: (industry: string) => void
}

export function StatsJumpPanel({
  open,
  kind,
  companies,
  useCases,
  onOpenChange,
  onCompanySelect,
  onUseCaseSelect,
  onIndustrySelect,
}: StatsJumpPanelProps) {
  const countries = Array.from(
    companies.reduce((acc, c) => {
      const key = c.headquarters_country?.trim() || "Unknown"
      acc.set(key, (acc.get(key) ?? 0) + 1)
      return acc
    }, new Map<string, number>())
  )
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([country, count]) => ({ country, count }))

  const industries = Array.from(
    companies.reduce((acc, c) => {
      const key = c.industry?.trim() || "Unknown"
      acc.set(key, (acc.get(key) ?? 0) + 1)
      return acc
    }, new Map<string, number>())
  )
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([industry, count]) => ({ industry, count }))

  const title =
    kind === "companies"
      ? "Companies"
      : kind === "countries"
        ? "Countries"
        : kind === "industries"
          ? "Industries"
          : "Use cases"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="z-[21010] max-h-[62vh] overflow-hidden rounded-t-2xl border-slate-700 bg-slate-950/95 p-0 text-slate-100 backdrop-blur-md"
      >
        <SheetHeader className="border-b border-slate-800/80 pb-3">
          <SheetTitle className="text-slate-100">{title}</SheetTitle>
        </SheetHeader>

        <div className="max-h-[calc(62vh-4.5rem)] overflow-y-auto p-4">
          {kind === "companies" && (
            <div className="space-y-2">
              {companies.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => onCompanySelect(company)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:border-cyan-500/40 hover:text-cyan-200"
                >
                  <span>{company.name}</span>
                  <span className="text-xs text-slate-400">
                    {company.city}, {company.headquarters_country}
                  </span>
                </button>
              ))}
            </div>
          )}

          {kind === "useCases" && (
            <div className="space-y-2">
              {useCases.map((useCase) => (
                <button
                  key={useCase.id}
                  type="button"
                  onClick={() => onUseCaseSelect(useCase)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:border-emerald-500/40 hover:text-emerald-200"
                >
                  <span>{useCaseDisplayName(useCase)}</span>
                  <span className="text-xs text-slate-400">
                    {[useCase.city, useCase.country].filter(Boolean).join(", ")}
                  </span>
                </button>
              ))}
            </div>
          )}

          {kind === "countries" && (
            <div className="space-y-2">
              {countries.map((entry) => (
                <div
                  key={entry.country}
                  className="flex items-center justify-between rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                >
                  <span>{entry.country}</span>
                  <span className="text-xs text-slate-400">{entry.count} companies</span>
                </div>
              ))}
            </div>
          )}

          {kind === "industries" && (
            <div className="space-y-2">
              {industries.map((entry) => (
                <button
                  key={entry.industry}
                  type="button"
                  onClick={() => onIndustrySelect(entry.industry)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:border-cyan-500/40 hover:text-cyan-200"
                >
                  <span>{entry.industry}</span>
                  <span className="text-xs text-slate-400">{entry.count} companies</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
