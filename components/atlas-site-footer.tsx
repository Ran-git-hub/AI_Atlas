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

export interface AtlasSiteFooterProps {
  latestDataUpdateCet: string
  /** Globe: fixed bottom bar; index: flows below main content */
  layout?: "fixed" | "inline"
  /** Used for the X/email share text; LinkedIn reads the page's OG tags instead. */
  shareTitle?: string
}

export function AtlasSiteFooter({
  latestDataUpdateCet,
  layout = "fixed",
  shareTitle,
}: AtlasSiteFooterProps) {
  const pathname = usePathname()
  const shareUrl = publicAbsoluteUrl(pathname || "/")

  const inner = (
    <div
      className={cn(
        "mx-auto flex max-w-[calc(100%-1rem)] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 text-xs text-slate-300 sm:max-w-none sm:text-sm",
        layout === "inline" ? "py-1" : "py-2"
      )}
    >
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
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="px-1 py-0.5 text-xs text-slate-200 transition-colors hover:text-cyan-300 sm:px-2 sm:py-1 sm:text-sm"
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
      </div>
      <ShareRow
        url={shareUrl}
        title={shareTitle ?? DEFAULT_SHARE_TITLE}
        label={null}
        className="justify-center gap-1.5"
      />
    </div>
  )

  if (layout === "inline") {
    return (
      <footer className="pointer-events-auto mt-0 border-t border-[#2f2f2f] pt-3 pb-5 text-slate-300">
        {inner}
      </footer>
    )
  }

  return (
    <div className="pointer-events-auto fixed bottom-0 left-1/2 z-20 w-full -translate-x-1/2 px-2">
      {inner}
    </div>
  )
}
