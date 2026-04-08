"use client"

import { CheckCheck } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { CompanyWithCoords, UseCaseWithCoords } from "@/lib/types"
import { useCaseDisplayName } from "@/lib/types"

export type StatsJumpKind = "companies" | "countries" | "industries" | "useCases"

interface StatsJumpPanelProps {
  open: boolean
  kind: StatsJumpKind
  companies: CompanyWithCoords[]
  useCases: UseCaseWithCoords[]
  industryOptions: Array<{ industry: string; count: number }>
  countryOptions: Array<{ country: string; count: number }>
  selectedIndustries: string[]
  selectedCountries: string[]
  onOpenChange: (open: boolean) => void
  onCompanySelect: (company: CompanyWithCoords) => void
  onUseCaseSelect: (useCase: UseCaseWithCoords) => void
  onIndustryToggle: (industry: string) => void
  onIndustrySelectAll: () => void
  onCountryToggle: (country: string) => void
  onCountrySelectAll: () => void
}

export function StatsJumpPanel({
  open,
  kind,
  companies,
  useCases,
  industryOptions,
  countryOptions,
  selectedIndustries,
  selectedCountries,
  onOpenChange,
  onCompanySelect,
  onUseCaseSelect,
  onIndustryToggle,
  onIndustrySelectAll,
  onCountryToggle,
  onCountrySelectAll,
}: StatsJumpPanelProps) {
  const isAllSelected = selectedIndustries.length === 0
  const isAllCountriesSelected = selectedCountries.length === 0
  const titleMeta =
    kind === "countries"
      ? isAllCountriesSelected
        ? `All ${countryOptions.length} countries`
        : `${selectedCountries.length} selected`
      : kind === "industries"
        ? isAllSelected
          ? `All ${industryOptions.length} industries`
          : `${selectedIndustries.length} selected`
        : null

  const title =
    kind === "companies"
      ? "Organizations"
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
          <SheetTitle className="flex items-center justify-between gap-3 text-slate-100">
            <span>{title}</span>
            {titleMeta ? (
              <span className="mr-8 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200 sm:mr-10 sm:text-sm">
                {titleMeta}
              </span>
            ) : null}
          </SheetTitle>
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
              <button
                type="button"
                onClick={onCountrySelectAll}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                  isAllCountriesSelected
                    ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]"
                    : "border-slate-700/80 bg-slate-900/80 text-slate-100 hover:border-cyan-500/40 hover:text-cyan-200"
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <CheckCheck className={`h-4 w-4 ${isAllCountriesSelected ? "text-cyan-300" : "text-slate-400"}`} />
                  <span>Select All</span>
                  {isAllCountriesSelected ? (
                    <span className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-200">
                      Default
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-slate-400">{countryOptions.length} countries</span>
              </button>
              {countryOptions.map((entry) => (
                <button
                  key={entry.country}
                  type="button"
                  onClick={() => onCountryToggle(entry.country)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selectedCountries.includes(entry.country)
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                      : "border-slate-800/70 bg-slate-900/70 text-slate-200 hover:border-cyan-500/40 hover:text-cyan-200"
                  }`}
                >
                  <span>{entry.country}</span>
                  <span className="text-xs text-slate-400">{entry.count} organizations</span>
                </button>
              ))}
            </div>
          )}

          {kind === "industries" && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={onIndustrySelectAll}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                  isAllSelected
                    ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]"
                    : "border-slate-700/80 bg-slate-900/80 text-slate-100 hover:border-cyan-500/40 hover:text-cyan-200"
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <CheckCheck className={`h-4 w-4 ${isAllSelected ? "text-cyan-300" : "text-slate-400"}`} />
                  <span>Select All</span>
                  {isAllSelected ? (
                    <span className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-200">
                      Default
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-slate-400">{industryOptions.length} industries</span>
              </button>
              {industryOptions.map((entry) => (
                <button
                  key={entry.industry}
                  type="button"
                  onClick={() => onIndustryToggle(entry.industry)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selectedIndustries.includes(entry.industry)
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                      : "border-slate-800/70 bg-slate-900/70 text-slate-200 hover:border-cyan-500/40 hover:text-cyan-200"
                  }`}
                >
                  <span>{entry.industry}</span>
                  <span className="text-xs text-slate-400">{entry.count} organizations</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
