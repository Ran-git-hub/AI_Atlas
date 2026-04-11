"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { ExternalLink, X } from "lucide-react"
import type { UseCaseCatalogRow } from "@/lib/types"
import { useCaseDisplayName } from "@/lib/types"

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

export function UseCaseIndexDetailModal({
  detail,
  onClose,
}: {
  detail: UseCaseCatalogRow
  onClose: () => void
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
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "94vw",
          maxWidth: 960,
          height: "78dvh",
          maxHeight: "78dvh",
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
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#b3b3b3" }}>
              Organization: {firstNonEmpty(detail.company_name, detail.company_id)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            style={{
              flexShrink: 0,
              padding: 8,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              color: "#b3b3b3",
              cursor: "pointer",
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
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
      </div>
    </div>
  )
}

/** Same portal target as UseCasesTable — avoids stacking issues on mobile. */
export function UseCaseIndexDetailModalPortal({
  detail,
  onClose,
}: {
  detail: UseCaseCatalogRow
  onClose: () => void
}) {
  if (typeof document === "undefined") return null
  return createPortal(<UseCaseIndexDetailModal detail={detail} onClose={onClose} />, document.body)
}
