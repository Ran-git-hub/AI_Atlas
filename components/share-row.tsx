"use client"

import { Mail } from "lucide-react"
import { LinkedInLogo, XLogo } from "@/components/brand-icons"
import { CopyLinkButton } from "@/components/copy-link-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const SITE_HOME = "https://ai-atlas.app"

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
  description,
  meta,
  emailSubject,
  label = "Share",
  className,
}: {
  url: string
  title: string
  /** One-line summary, included in the email body when present. */
  description?: string | null
  /** Context line, e.g. "Ford Motor Company · Automobile Manufacturers · Dearborn". */
  meta?: string | null
  /** Defaults to `title`; pass a source-prefixed variant for inbox context. */
  emailSubject?: string
  label?: string | null
  className?: string
}) {
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  const xUrl = `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  // A bare mailto: silently does nothing when no mail handler is registered,
  // which is the norm for people living in Gmail/Outlook on the web — hence the
  // webmail compose links alongside it.
  const subject = encodeURIComponent(emailSubject ?? title)
  const body = encodeURIComponent(
    [
      "Hi,",
      "",
      "Thought this might be of interest:",
      "",
      title,
      meta?.trim() || null,
      description?.trim() ? "" : null,
      description?.trim() || null,
      "",
      url,
      "",
      "—",
      "Shared from AI Atlas — real-world AI deployments worldwide",
      SITE_HOME,
    ]
      .filter((line) => line !== null)
      .join("\n"),
  )
  const emailUrl = `mailto:?subject=${subject}&body=${body}`
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`
  const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?subject=${subject}&body=${body}`

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
      {/* modal={false}: the modal scroll-lock adds a scrollbar-width margin to
          body, which double-counts against globals.css's `scrollbar-gutter:
          stable` and visibly shifts the page when the menu opens. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={shareButtonClass}
            aria-label="Share by email"
            title="Share by email"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="border-cyan-500/25 bg-slate-900/95 text-white backdrop-blur-md"
        >
          <DropdownMenuItem asChild className="text-[#f5f5f5] focus:bg-slate-800 focus:text-white">
            <a href={emailUrl}>Default mail app</a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="text-[#f5f5f5] focus:bg-slate-800 focus:text-white">
            <a href={gmailUrl} target="_blank" rel="noreferrer">
              Gmail
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="text-[#f5f5f5] focus:bg-slate-800 focus:text-white">
            <a href={outlookUrl} target="_blank" rel="noreferrer">
              Outlook
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CopyLinkButton url={url} iconOnly className={shareButtonClass} />
    </div>
  )
}
