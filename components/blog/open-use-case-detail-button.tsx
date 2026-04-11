"use client"

import { useCallback, useState } from "react"
import { UseCaseIndexDetailModalPortal } from "@/components/use-cases/use-case-index-detail-modal"
import type { UseCaseCatalogRow } from "@/lib/types"
import { cn } from "@/lib/utils"

type Props = {
  useCaseId: string
  className?: string
  /** Ensures accent color even when global or parent styles override Tailwind text utilities. */
  style?: React.CSSProperties
  /**
   * `title` — full heading as the only control; never falls back to `→ Details` (weekly highlight cards).
   * `chip` — related-ID chips etc.; uses `children` or `→ linkLabel` when empty.
   */
  variant?: "chip" | "title"
  /**
   * Plain-text label when not using `children` (reliable across RSC → client as a serializable prop).
   */
  linkText?: string
  /** Used only for `variant="chip"` when `children` and `linkText` are both empty. */
  linkLabel?: string
  children?: React.ReactNode
}

function stripTrailingDetailsCta(raw: string): string {
  return raw
    .replace(/\s*→\s*Details\s*$/i, "")
    .replace(/\s*›\s*Details\s*$/i, "")
    .trim()
}

function buttonInner({
  variant,
  children,
  linkText,
  linkLabel,
}: Pick<Props, "variant" | "children" | "linkText" | "linkLabel"> & { linkLabel: string }): React.ReactNode {
  if (variant === "title") {
    const raw = String(
      linkText ?? (typeof children === "string" ? children : typeof children === "number" ? children : "") ?? "",
    ).trim()
    const cleaned = stripTrailingDetailsCta(raw)
    return cleaned || "Untitled"
  }
  return children ?? linkText ?? `→ ${linkLabel}`
}

export function OpenUseCaseDetailButton({
  useCaseId,
  className,
  style,
  variant = "chip",
  linkText,
  linkLabel = "Details",
  children,
}: Props) {
  const [detail, setDetail] = useState<UseCaseCatalogRow | null>(null)
  const [loading, setLoading] = useState(false)

  const handleOpen = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/use-cases/${encodeURIComponent(useCaseId)}`)
      if (!res.ok) {
        console.error("[blog] use case fetch", res.status, useCaseId)
        return
      }
      const data = (await res.json()) as UseCaseCatalogRow
      setDetail(data)
    } catch (e) {
      console.error("[blog] use case fetch", e)
    } finally {
      setLoading(false)
    }
  }, [useCaseId])

  const handleClose = useCallback(() => {
    setDetail(null)
  }, [])

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={handleOpen}
        style={style}
        className={cn(className, loading && "cursor-wait opacity-60")}
      >
        {buttonInner({ variant, children, linkText, linkLabel })}
      </button>
      {detail ? <UseCaseIndexDetailModalPortal detail={detail} onClose={handleClose} /> : null}
    </>
  )
}
