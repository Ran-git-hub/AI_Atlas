"use client"

import { useState, useEffect, useMemo } from "react"
import { X, ExternalLink, Sparkles, ChevronLeft } from "lucide-react"
import {
  isUseCasePendingValidation,
  useCaseDisplayName,
  type CompanyWithCoords,
  type UseCaseWithCoords,
} from "@/lib/types"
import { USE_CASE_PANEL_ACCENT } from "@/lib/use-case-panel-accent"

interface UseCaseDetailPanelProps {
  useCase: UseCaseWithCoords
  onClose: () => void
  /** When opened from company panel → related use case; enables back navigation. */
  returnToCompany?: CompanyWithCoords | null
  onReturnToCompany?: () => void
}

const ACCENT = USE_CASE_PANEL_ACCENT
const NA = "Not Available"

function isUseCaseRecent24h(useCase: UseCaseWithCoords): boolean {
  const updatedAt = (useCase as UseCaseWithCoords & { updated_at?: string | null }).updated_at
  const ts = Date.parse(updatedAt ?? useCase.created_at ?? "")
  return Number.isFinite(ts) && Date.now() - ts <= 24 * 60 * 60 * 1000
}

function isProbablyUrl(key: string, value: string): boolean {
  if (!/^https?:\/\//i.test(value.trim())) return false
  if (value.includes("\n")) return false
  return /url|link|href|website/i.test(key)
}

export function UseCaseDetailPanel({
  useCase,
  onClose,
  returnToCompany = null,
  onReturnToCompany,
}: UseCaseDetailPanelProps) {
  const [imageError, setImageError] = useState(false)
  const [lazyContent, setLazyContent] = useState<string | null>(null)
  const [contentLoading, setContentLoading] = useState(false)

  const hasContentField = useCase.fieldEntries.some(
    (e) => e.key.toLowerCase() === "content",
  )

  useEffect(() => {
    if (hasContentField) return
    setLazyContent(null)
    setContentLoading(true)
    let cancelled = false
    setContentLoading(true)
    fetch(`/api/use-cases/${encodeURIComponent(useCase.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Record<string, unknown> | null) => {
        if (cancelled || !data) return
        const entries = (data as { fieldEntries?: Array<{ key: string; value: string }> }).fieldEntries
        const contentEntry = entries?.find((e) => e.key.toLowerCase() === "content")
        if (contentEntry?.value) setLazyContent(contentEntry.value)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setContentLoading(false) })
    return () => { cancelled = true }
  }, [useCase.id, hasContentField])

  const displayEntries = useMemo(() => {
    if (!lazyContent || hasContentField) return useCase.fieldEntries
    const entries = [...useCase.fieldEntries]
    const idx = entries.findIndex((e) => {
      const k = e.key.toLowerCase()
      return k === "title" || k === "description" || k === "summary"
    })
    entries.splice(
      idx >= 0 ? idx + 1 : entries.length,
      0,
      { key: "content", label: "Content", value: lazyContent },
    )
    return entries
  }, [useCase.fieldEntries, lazyContent, hasContentField])

  const title = useCaseDisplayName(useCase)
  const showHeaderImage = Boolean(useCase.image_url?.trim()) && !imageError
  const isRecent = isUseCaseRecent24h(useCase)
  const isPending = isUseCasePendingValidation(useCase)

  return (
    <div
      data-use-case-detail-panel
      className="fixed right-0 top-[var(--app-top-bar-height)] bottom-0 w-full max-w-md z-40 animate-in slide-in-from-right duration-300"
    >
      <div
        className="flex h-full flex-col overflow-hidden border-l bg-slate-900/85 backdrop-blur-xl"
        style={{ borderColor: `${ACCENT}33` }}
      >
        <div className="detail-panel-scroll-use-case min-h-0 flex-1 overflow-y-auto">
        <div
          className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b"
          style={{ borderColor: `${ACCENT}22` }}
        >
          {returnToCompany && onReturnToCompany ? (
            <div className="border-b border-slate-800/80 px-4 pt-3 pb-2">
              <button
                type="button"
                onClick={onReturnToCompany}
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-base font-medium text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
              >
                <ChevronLeft className="h-6 w-6 shrink-0" aria-hidden />
                <span className="min-w-0 truncate">
                  Back to <span className="text-slate-100">{returnToCompany.name}</span>
                </span>
              </button>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Use case</h2>
              {isRecent ? (
                <span className="inline-flex rounded-full border border-yellow-300/55 bg-yellow-200/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-200">
                  New
                </span>
              ) : null}
              {isPending ? (
                <span className="inline-flex rounded-full border border-sky-300/45 bg-sky-300/12 px-2 py-0.5 text-[10px] font-semibold text-sky-100">
                  To be validated
                </span>
              ) : null}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800/80 transition-colors text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-xl bg-slate-800 border overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ borderColor: `${ACCENT}44` }}
            >
              {showHeaderImage ? (
                <img
                  src={useCase.image_url!}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Sparkles className="h-8 w-8" style={{ color: ACCENT }} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div>
                <h3 className="text-xl font-bold leading-snug text-white break-words">
                  {title}
                </h3>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                {/* Intentionally removed internal-columns note */}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Record fields
            </h4>
            <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 divide-y divide-slate-800/80 overflow-hidden">
              {displayEntries.map(({ key, label, value }) => {
                const trimmed = value.trim()
                const display = trimmed ? trimmed : NA
                const url = isProbablyUrl(key, trimmed)

                return (
                  <div key={key} className="px-4 py-3.5 space-y-1.5">
                    <div className="text-xs font-medium text-slate-500 tracking-wide">
                      {label}
                    </div>
                    {url ? (
                      <a
                        href={trimmed}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium break-all hover:underline"
                        style={{ color: ACCENT }}
                      >
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        {trimmed}
                      </a>
                    ) : (
                      <p
                        className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${
                          trimmed ? "text-slate-200" : "text-slate-500 italic"
                        }`}
                      >
                        {display}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
