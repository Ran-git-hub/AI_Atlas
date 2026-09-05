"use client"

import { Mail } from "lucide-react"
import { LinkedInLogo, XLogo } from "@/components/brand-icons"
import { CopyLinkButton } from "@/components/copy-link-button"
import { cn } from "@/lib/utils"

const shareButtonClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 text-[#d4d4d4] transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"

/**
 * `url` is resolved by the caller (on the server where possible) so the hrefs
 * can't disagree across hydration. LinkedIn reads the target page's OG tags, so
 * it only needs the URL.
 */
export function ShareRow({
  url,
  title,
  label = "Share",
  className,
}: {
  url: string
  title: string
  label?: string | null
  className?: string
}) {
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  const xUrl = `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
    `${title}\n\n${url}\n\nvia AI Atlas — real-world AI deployments`,
  )}`

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {label ? (
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
      ) : null}
      <a
        href={linkedInUrl}
        target="_blank"
        rel="noreferrer"
        className={shareButtonClass}
        aria-label="Share on LinkedIn"
        title="Share on LinkedIn"
      >
        <LinkedInLogo />
      </a>
      <a
        href={xUrl}
        target="_blank"
        rel="noreferrer"
        className={shareButtonClass}
        aria-label="Share on X"
        title="Share on X"
      >
        <XLogo />
      </a>
      <a
        href={emailUrl}
        className={shareButtonClass}
        aria-label="Share by email"
        title="Share by email"
      >
        <Mail className="h-4 w-4 shrink-0" aria-hidden />
      </a>
      <CopyLinkButton url={url} iconOnly className={shareButtonClass} />
    </div>
  )
}
