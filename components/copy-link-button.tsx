"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"

const COPIED_RESET_MS = 2000

/**
 * navigator.clipboard needs a secure context and a focused document, so fall
 * back to a hidden textarea rather than letting the button no-op in silence.
 */
async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // fall through
  }
  try {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.setAttribute("readonly", "")
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

/**
 * Inline "Copied" feedback rather than a toast: <Toaster /> is mounted per-page
 * and is absent on /news, the blog modals and the globe, where this also renders.
 */
export function CopyLinkButton({
  url,
  className,
  label = "Copy link",
  iconOnly = false,
}: {
  url: string
  className?: string
  label?: string
  iconOnly?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  async function handleCopy() {
    if (!(await writeToClipboard(url))) return
    setCopied(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS)
  }

  const iconSize = iconOnly ? "h-4 w-4" : "h-3.5 w-3.5"

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Link copied" : label}
      title={copied ? "Link copied" : label}
      className={
        iconOnly
          ? className
          : cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-[#d4d4d4] transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35",
              className,
            )
      }
    >
      {copied ? (
        <Check className={cn(iconSize, "shrink-0 text-[#7ee0b2]")} aria-hidden />
      ) : (
        <Link2 className={cn(iconSize, "shrink-0")} aria-hidden />
      )}
      {iconOnly ? null : copied ? "Copied" : label}
    </button>
  )
}
