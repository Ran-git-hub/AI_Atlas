"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShareRow } from "@/components/share-row"
import { publicAbsoluteUrl } from "@/lib/site-url"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const DEFAULT_SHARE_TITLE = "AI Atlas — real-world AI deployments worldwide"

/**
 * Footer link columns, in the shape aiusecasehub.com uses: a brand block
 * beside grouped columns, over a legal bar.
 *
 * Theirs runs to five columns and 33 links; AI Atlas has eight sections, so
 * three columns keeps them full instead of leaving two mostly empty.
 *
 * Rendered only in the inline layout. The fixed layout is the globe's floating
 * bar, and a block this tall would cover the map.
 */
const FOOTER_COLUMNS: Array<{
  title: string
  links: Array<{ label: string; href: string }>
}> = [
  {
    title: "Explore",
    links: [
      { label: "Globe", href: "/" },
      { label: "Use Cases", href: "/use-cases" },
      { label: "Industries", href: "/industries" },
      { label: "Countries", href: "/countries" },
    ],
  },
  {
    title: "Updates",
    links: [
      { label: "News", href: "/news" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "About",
    links: [{ label: "Data Quality Dashboard", href: "/quality" }],
  },
]

export interface AtlasSiteFooterProps {
  latestDataUpdateCet: string
  /** Globe: fixed bottom bar; index: flows below main content */
  layout?: "fixed" | "inline"
  /** Used for the X/email share text; LinkedIn reads the page's OG tags instead. */
  shareTitle?: string
}

const linkClass =
  "text-sm text-slate-400 transition-colors hover:text-[#43cc93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43cc93]/40"

export function AtlasSiteFooter({
  latestDataUpdateCet,
  layout = "fixed",
  shareTitle,
}: AtlasSiteFooterProps) {
  const pathname = usePathname()
  const shareUrl = publicAbsoluteUrl(pathname || "/")

  const aboutDialog = (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            layout === "inline"
              ? cn(linkClass, "text-left")
              : "px-1 py-0.5 text-xs text-slate-200 transition-colors hover:text-cyan-300 sm:px-2 sm:py-1 sm:text-sm",
          )}
        >
          About
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md border-slate-700 bg-slate-950/95 text-slate-100">
        <DialogHeader>
          <DialogTitle>About AI Atlas</DialogTitle>
          <DialogDescription className="text-slate-400">
            Data transparency and attribution.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-slate-200">
          <p>
            <span className="font-medium text-slate-100">Data sources:</span>{" "}
            Organization websites, public announcements, and curated AI use-case records.
          </p>
          <p>
            <span className="font-medium text-slate-100">Method note:</span>{" "}
            Locations, categories, and links are best-effort and may contain
            inaccuracies.
          </p>
          <p>
            <span className="font-medium text-slate-100">Maintainer:</span>{" "}
            Ran{" "}
            <a
              href="mailto:allenheran@gmail.com"
              className="text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
            >
              allenheran@gmail.com
            </a>
            {" · "}
            <a
              href="https://www.linkedin.com/in/ran-he-1968885"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
            >
              LinkedIn
            </a>
          </p>
          <div className="space-y-1.5 rounded-md border border-slate-800/80 bg-slate-900/70 p-3 text-xs text-slate-400">
            <p className="font-medium uppercase tracking-wide text-slate-300">
              Disclaimer
            </p>
            <p>
              Information is provided for reference only and does not constitute
              professional advice.
            </p>
            <p>
              Data may be incomplete, delayed, or inaccurate; please verify with
              official sources.
            </p>
            <p>
              Organization names, logos, and trademarks belong to their respective owners.
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Latest Data Update: {latestDataUpdateCet} · © 2026 AI Atlas. All rights
            reserved.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (layout === "inline") {
    return (
      <footer className="pointer-events-auto mt-0 rounded-xl border border-[#2f2f2f] bg-[#161616] px-5 py-7 text-slate-300">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div className="min-w-0">
            <p className="text-base font-semibold text-[#f5f5f5]">AI Atlas</p>
            <p className="mt-2 max-w-sm text-pretty text-sm leading-relaxed text-slate-400">
              Real-world AI deployments across organizations, industries and
              countries — each one source-linked and checked before it is published.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://www.linkedin.com/in/ran-he-1968885"
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                LinkedIn
              </a>
              <span className="text-slate-700">·</span>
              <a href="mailto:allenheran@gmail.com" className={linkClass}>
                Contact
              </a>
            </div>
          </div>

          {/* md:contents lets these join the parent grid on wide screens while
              still tiling two-up on a phone, where one column each would push
              the footer past 700px tall. */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 md:contents">
            {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col">
              {/* Plain 16px near-white, matching the reference footer: an
                  uppercase 12px micro-label reads as fine print next to
                  14px links. */}
              <p className="text-base text-slate-100">{column.title}</p>
              <ul className="mt-3 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                {column.title === "About" ? <li>{aboutDialog}</li> : null}
              </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-[#2f2f2f] pt-4 text-xs text-slate-400">
          <span>
            Latest Data Update: {latestDataUpdateCet} · © 2026 AI Atlas
          </span>
          <ShareRow
            url={shareUrl}
            title={shareTitle ?? DEFAULT_SHARE_TITLE}
            label={null}
            className="gap-1.5"
          />
        </div>
      </footer>
    )
  }

  return (
    <div className="pointer-events-auto fixed bottom-0 left-1/2 z-20 w-full -translate-x-1/2 px-2">
      <div className="mx-auto flex max-w-[calc(100%-1rem)] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 py-2 text-xs text-slate-300 sm:max-w-none sm:text-sm">
        <span className="whitespace-nowrap text-center">
          Latest Data Update: {latestDataUpdateCet}
        </span>
        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
          <span className="text-slate-600">|</span>
          <span className="whitespace-nowrap">© 2026 AI Atlas</span>
          <span className="text-slate-600">|</span>
          <Link
            href="/quality"
            className="px-1 py-0.5 text-xs text-slate-200 transition-colors hover:text-cyan-300 sm:px-2 sm:py-1 sm:text-sm"
          >
            Data Quality Dashboard
          </Link>
          <span className="text-slate-600">|</span>
          {aboutDialog}
        </div>
        <ShareRow
          url={shareUrl}
          title={shareTitle ?? DEFAULT_SHARE_TITLE}
          label={null}
          className="justify-center gap-1.5"
        />
      </div>
    </div>
  )
}
