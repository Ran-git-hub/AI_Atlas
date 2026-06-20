"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, ExternalLink, X } from "lucide-react"
import type { UseCaseCatalogRow } from "@/lib/types"
import { isUseCasePendingValidation, USE_CASE_STATUSES, useCaseDisplayName } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function isUseCaseCatalogRowRecent24h(row: UseCaseCatalogRow): boolean {
  const ts = Date.parse(row.updated_at ?? row.created_at ?? "")
  return Number.isFinite(ts) && Date.now() - ts <= 24 * 60 * 60 * 1000
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const v = value?.trim()
    if (v) return v
  }
  return "—"
}

function isProbablyUrl(_key: string, value: string): boolean {
  const v = value.trim()
  if (!/^https?:\/\//i.test(v)) return false
  if (v.includes("\n")) return false
  return true
}

type RelatedUseCase = {
  row: UseCaseCatalogRow
  reasons: string[]
  score: number
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Unknown date"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown date"
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function UseCaseIndexDetailModal({
  detail,
  relatedUseCases = [],
  onRelatedUseCaseClick,
  onBack,
  canGoBack = false,
  onClose,
  onStatusChange,
}: {
  detail: UseCaseCatalogRow
  relatedUseCases?: RelatedUseCase[]
  onRelatedUseCaseClick?: (row: UseCaseCatalogRow) => void
  onBack?: () => void
  canGoBack?: boolean
  onClose: () => void
  onStatusChange?: (id: string, newStatus: string) => Promise<void>
}) {
  const backdropRef = React.useRef<HTMLDivElement>(null)
  const openedAt = React.useRef(Date.now())

  React.useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target !== backdropRef.current) return
        if (Date.now() - openedAt.current < 350) return
        onClose()
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.72)",
      }}
    >
      <div
        className="h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[96vw] max-w-[1180px] md:h-[88dvh] md:max-h-[88dvh] lg:h-[78dvh] lg:max-h-[78dvh]"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          borderRadius: 16,
          border: "1px solid #2f2f2f",
          backgroundColor: "#1c1c1c",
          color: "#f5f5f5",
          boxShadow: "0 18px 48px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            padding: "16px 20px",
            borderBottom: "1px solid #2f2f2f",
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#f5f5f5",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                  flex: "1 1 auto",
                }}
              >
                {useCaseDisplayName(detail)}
              </h3>
              {isUseCaseCatalogRowRecent24h(detail) ? (
                <span
                  style={{
                    flexShrink: 0,
                    borderRadius: 9999,
                    border: "1px solid rgba(253,224,71,0.55)",
                    backgroundColor: "rgba(254,240,138,0.15)",
                    padding: "2px 8px",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "#fef9c3",
                  }}
                >
                  New
                </span>
              ) : null}
              {isUseCasePendingValidation(detail) ? (
                <span
                  style={{
                    flexShrink: 0,
                    borderRadius: 9999,
                    border: "1px solid rgba(125,211,252,0.45)",
                    backgroundColor: "rgba(125,211,252,0.12)",
                    padding: "2px 8px",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#e0f2fe",
                  }}
                >
                  To be validated
                </span>
              ) : null}
            </div>
            {onStatusChange ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#8a8a8a",
                  }}
                >
                  Status
                </span>
                <Select
                  value={detail.status ?? ""}
                  onValueChange={(next) => {
                    if (next === (detail.status ?? "")) return
                    onStatusChange(detail.id, next)
                  }}
                >
                  <SelectTrigger
                    aria-label="Change status"
                    className="h-8 w-[150px] border-white/15 bg-[#181818] text-[#f5f5f5]"
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent
                    className="border-white/15 bg-[#181818] text-[#f5f5f5]"
                    style={{ zIndex: 100000 }}
                  >
                    {USE_CASE_STATUSES.map((value) => (
                      <SelectItem
                        key={value}
                        value={value}
                        className="text-[#f5f5f5] capitalize focus:bg-slate-800 focus:text-white"
                      >
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#b3b3b3" }}>
              Company/Organization: {firstNonEmpty(detail.company_name, detail.company_id)}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {canGoBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Go back"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#43cc93]/35 bg-[#43cc93]/10 px-3 py-2 text-sm font-medium text-[#7ee0b2] transition-colors hover:border-[#43cc93]/60 hover:bg-[#43cc93]/15 hover:text-[#a8f0cc]"
              >
                <ArrowLeft style={{ width: 14, height: 14, flexShrink: 0 }} />
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[#b3b3b3] transition-colors hover:bg-white/5 hover:text-white md:h-8 md:w-8 md:rounded-md"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <X className="h-6 w-6 md:h-[18px] md:w-[18px]" />
            </button>
          </div>
        </div>

        <div
          className="detail-panel-scroll-use-case min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:overflow-hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="min-h-0 lg:overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
            {detail.fieldEntries.map(({ key, label, value }) => {
              const trimmed = value.trim()
              const display = trimmed || "Not Available"
              const url = trimmed && isProbablyUrl(key, trimmed)

              return (
                <div
                  key={key}
                  style={{
                    display: "grid",
                    gap: 8,
                    padding: "12px 20px",
                    borderBottom: "1px solid #2f2f2f",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 500, letterSpacing: "0.03em", color: "#8a8a8a" }}>
                    {label}
                  </p>
                  {url ? (
                    <a
                      href={trimmed}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 14,
                        color: "#43cc93",
                        textDecoration: "underline",
                        textDecorationColor: "rgba(67,204,147,0.4)",
                        textUnderlineOffset: 3,
                        wordBreak: "break-all",
                        padding: "4px 0",
                      }}
                    >
                      <ExternalLink style={{ width: 14, height: 14, flexShrink: 0 }} />
                      {trimmed}
                    </a>
                  ) : (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        color: trimmed ? "#f5f5f5" : "#8a8a8a",
                        fontStyle: trimmed ? "normal" : "italic",
                      }}
                    >
                      {display}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <aside className="min-h-0 border-t border-[#2f2f2f] bg-black/15 p-4 lg:overflow-y-auto lg:border-t-0 lg:border-l">
            <h4 className="text-sm font-semibold text-white">Related use cases</h4>
            <p className="mt-1 text-xs leading-relaxed text-[#8a8a8a]">
              Similar deployments from the catalog.
            </p>
            {relatedUseCases.length > 0 ? (
              <div className="mt-4 space-y-3">
                {relatedUseCases.map((item) => (
                  <RelatedUseCaseCard
                    key={item.row.id}
                    item={item}
                    onClick={onRelatedUseCaseClick}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#8a8a8a]">No related use cases found yet.</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

/** Same portal target as UseCasesTable — avoids stacking issues on mobile. */
export function UseCaseIndexDetailModalPortal({
  detail,
  relatedUseCases,
  onRelatedUseCaseClick,
  onBack,
  canGoBack,
  onClose,
  onStatusChange,
}: {
  detail: UseCaseCatalogRow
  relatedUseCases?: RelatedUseCase[]
  onRelatedUseCaseClick?: (row: UseCaseCatalogRow) => void
  onBack?: () => void
  canGoBack?: boolean
  onClose: () => void
  onStatusChange?: (id: string, newStatus: string) => Promise<void>
}) {
  if (typeof document === "undefined") return null
  return createPortal(
    <UseCaseIndexDetailModal
      detail={detail}
      relatedUseCases={relatedUseCases}
      onRelatedUseCaseClick={onRelatedUseCaseClick}
      onBack={onBack}
      canGoBack={canGoBack}
      onClose={onClose}
      onStatusChange={onStatusChange}
    />,
    document.body
  )
}

function RelatedUseCaseCard({
  item,
  onClick,
}: {
  item: RelatedUseCase
  onClick?: (row: UseCaseCatalogRow) => void
}) {
  const row = item.row
  const meta = [
    row.company_name?.trim(),
    row.industry?.trim(),
    row.country?.trim(),
  ].filter(Boolean)

  return (
    <button
      type="button"
      onClick={() => onClick?.(row)}
      className="group block w-full rounded-lg border border-white/10 bg-white/[0.04] p-3 text-left transition-colors hover:border-[#43cc93]/45 hover:bg-white/[0.07]"
    >
      <h5 className="line-clamp-3 text-sm font-semibold leading-snug text-white group-hover:text-[#43cc93]">
        {useCaseDisplayName(row)}
      </h5>
      {meta.length > 0 ? (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#8a8a8a]">
          {meta.join(" · ")}
        </p>
      ) : null}
      <p className="mt-1 text-xs text-[#666]">{formatDate(row.updated_at || row.created_at)}</p>
    </button>
  )
}
