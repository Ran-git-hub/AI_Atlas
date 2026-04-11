"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export interface AtlasSiteFooterProps {
  latestDataUpdateCet: string
  /** Globe: fixed bottom bar; index: flows below main content */
  layout?: "fixed" | "inline"
}

export function AtlasSiteFooter({
  latestDataUpdateCet,
  layout = "fixed",
}: AtlasSiteFooterProps) {
  const inner = (
    <div
      className={cn(
        "mx-auto flex max-w-[calc(100vw-1rem)] flex-col items-center justify-center gap-y-0.5 px-2 text-xs text-slate-300 sm:max-w-none sm:flex-row sm:gap-x-2 sm:gap-y-0 sm:text-sm",
        layout === "inline" ? "py-1" : "py-2"
      )}
    >
      <span className="text-center">
        Latest Data Update: {latestDataUpdateCet}
      </span>
      <div className="flex items-center justify-center gap-2">
        <span className="hidden text-slate-600 sm:inline">|</span>
        <span>© 2026 AI Atlas</span>
        <span className="text-slate-600">|</span>
        <Link
          href="/blog"
          className="px-1 py-0.5 text-xs text-slate-200 transition-colors hover:text-cyan-300 sm:px-2 sm:py-1 sm:text-sm"
        >
          Blog
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
                Company websites, public announcements, and curated AI use-case records.
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
                  Company names, logos, and trademarks belong to their respective owners.
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
    <div className="pointer-events-auto fixed bottom-0 left-1/2 z-20 w-full -translate-x-1/2 px-2 sm:w-auto sm:px-0">
      {inner}
    </div>
  )
}
