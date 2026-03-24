"use client"

import { useState } from "react"
import { X, ExternalLink, Sparkles } from "lucide-react"
import { useCaseDisplayName, type UseCaseWithCoords } from "@/lib/types"

interface UseCaseDetailPanelProps {
  useCase: UseCaseWithCoords
  onClose: () => void
}

const ACCENT = "#3cb371"
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

export function UseCaseDetailPanel({ useCase, onClose }: UseCaseDetailPanelProps) {
  const [imageError, setImageError] = useState(false)
  const title = useCaseDisplayName(useCase)
  const showHeaderImage = Boolean(useCase.image_url?.trim()) && !imageError
  const isRecent = isUseCaseRecent24h(useCase)

  return (
    <div
      data-use-case-detail-panel
      className="fixed right-0 top-[var(--app-top-bar-height)] bottom-0 w-full max-w-md z-40 animate-in slide-in-from-right duration-300"
      style={{ top: "var(--app-top-bar-height, 4.75rem)" }}
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
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-semibold text-white">Use case</h2>
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
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white leading-snug">{title}</h3>
                {isRecent ? (
                  <span className="shrink-0 rounded-full border border-yellow-300/55 bg-yellow-200/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-200">
                    New
                  </span>
                ) : null}
              </div>
              <p className="text-slate-500 text-xs mt-1">
                Fields from AI_Atlas_Use_Cases (some internal columns are hidden).
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Record fields
            </h4>
            <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 divide-y divide-slate-800/80 overflow-hidden">
              {useCase.fieldEntries.map(({ key, label, value }) => {
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
