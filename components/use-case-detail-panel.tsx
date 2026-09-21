"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X, ExternalLink, Sparkles, ChevronLeft, SquareArrowOutUpRight } from "lucide-react"
import { CopyLinkButton } from "@/components/copy-link-button"
import { absoluteUrl } from "@/lib/site-url"
import {
  isUseCasePendingValidation,
  useCaseDisplayName,
  type CompanyWithCoords,
  type UseCaseFieldEntry,
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
  // The globe payload no longer carries fieldEntries. This panel already hit
  // the same route on every open, because USE_CASES_ROW_SELECT never selected
  // `content` and so the content entry was always missing - taking the whole
  // set from that response instead of just the content entry costs no extra
  // request, and arrives in buildUseCaseFieldEntries' own order, which already
  // places content directly after title.
  const [lazyFieldEntries, setLazyFieldEntries] = useState<UseCaseFieldEntry[] | null>(null)
  // The whole table is empty until the fetch lands now, not just its content
  // row, so the panel has to say so rather than showing an empty frame.
  const [entriesLoading, setEntriesLoading] = useState(false)

  const displayEntries = useCase.fieldEntries ?? lazyFieldEntries ?? []

  useEffect(() => {
    if (useCase.fieldEntries) return
    setLazyFieldEntries(null)
    setEntriesLoading(true)
    let cancelled = false
    fetch(`/api/use-cases/${encodeURIComponent(useCase.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Record<string, unknown> | null) => {
        if (cancelled || !data) return
        const entries = (data as { fieldEntries?: UseCaseFieldEntry[] }).fieldEntries
        if (entries) setLazyFieldEntries(entries)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setEntriesLoading(false) })
    return () => { cancelled = true }
  }, [useCase.id, useCase.fieldEntries])

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
          <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
            <Link
              href={`/use-cases/${encodeURIComponent(useCase.id)}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
              style={{
                borderColor: `${ACCENT}59`,
                backgroundColor: `${ACCENT}1a`,
                color: "#7ee0b2",
              }}
            >
              <SquareArrowOutUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Open full page
            </Link>
            <CopyLinkButton url={absoluteUrl(`/use-cases/${encodeURIComponent(useCase.id)}`)} />
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
              {displayEntries.length === 0 && entriesLoading ? (
                <div className="px-4 py-3.5">
                  <p className="text-sm text-slate-500 italic">Loading…</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
