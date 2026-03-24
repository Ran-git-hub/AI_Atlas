"use client"

import { useEffect, useState } from "react"
import {
  Hand,
  ZoomIn,
  MousePointer2,
  Loader2,
  ChevronLeft,
  Lightbulb,
} from "lucide-react"
import {
  INTERACTION_TIPS_SHOW_EVENT,
  INTERACTION_TIPS_STORAGE_KEY,
} from "@/lib/interaction-tips"

export function InteractionTips() {
  const [collapsed, setCollapsed] = useState(false)
  const [isTouchLike, setIsTouchLike] = useState(false)
  const toggleButtonClass =
    `inline-flex items-center justify-center rounded-full border border-slate-500/60 bg-slate-800/70 text-slate-300 transition-colors hover:border-cyan-500/45 hover:text-cyan-300 touch-manipulation ${
      isTouchLike ? "h-11 w-11" : "h-8 w-8"
    }`

  useEffect(() => {
    try {
      const persisted = window.localStorage.getItem(INTERACTION_TIPS_STORAGE_KEY)
      if (persisted === "1") {
        setCollapsed(true)
      }
    } catch {
      // Ignore storage errors and keep tips visible.
    }

    const onShowTips = () => {
      setCollapsed(false)
      try {
        window.localStorage.removeItem(INTERACTION_TIPS_STORAGE_KEY)
      } catch {
        // Ignore storage errors.
      }
    }

    window.addEventListener(INTERACTION_TIPS_SHOW_EVENT, onShowTips)

    const mq = window.matchMedia("(hover: none), (pointer: coarse)")
    const syncTouchMode = () => setIsTouchLike(mq.matches)
    syncTouchMode()
    mq.addEventListener("change", syncTouchMode)

    return () => {
      window.removeEventListener(INTERACTION_TIPS_SHOW_EVENT, onShowTips)
      mq.removeEventListener("change", syncTouchMode)
    }
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        if (next) {
          window.localStorage.setItem(INTERACTION_TIPS_STORAGE_KEY, "1")
        } else {
          window.localStorage.removeItem(INTERACTION_TIPS_STORAGE_KEY)
        }
      } catch {
        // Ignore storage errors.
      }
      return next
    })
  }

  return (
    <aside
      className={`pointer-events-auto fixed left-0 top-1/2 z-30 block h-48 -translate-y-1/2 overflow-visible rounded-xl border border-slate-600/45 bg-slate-900/45 shadow-lg shadow-black/20 backdrop-blur-xl transition-[width] duration-300 ease-out md:left-3 ${
        collapsed ? "w-12" : "w-72"
      }`}
    >
      {/* Collapsed rail (always mounted for smooth transition) */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className={`group absolute inset-0 flex flex-col items-center justify-center rounded-xl text-slate-300 transition-all duration-300 hover:text-cyan-300 ${
          collapsed
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-label="Expand interaction tips"
      >
        <Lightbulb className="absolute left-1/2 top-4 h-5 w-5 -translate-x-1/2 text-cyan-300" />
        <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${toggleButtonClass}`}>
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </span>
        <span
          className={`pointer-events-none absolute left-full top-1/2 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-600/50 bg-slate-900/85 px-2 py-1 text-xs text-slate-100 shadow-md backdrop-blur-md transition-opacity duration-200 md:block ${
            isTouchLike ? "opacity-0" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          Show tips
        </span>
      </button>

      {/* Expanded panel content (always mounted for left-right slide) */}
      <div
        className={`h-full overflow-hidden p-4 transition-opacity duration-200 ease-out ${
          collapsed ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
        }`}
        style={{
          clipPath: collapsed ? "inset(0 100% 0 0)" : "inset(0 0 0 0)",
          transition: "clip-path 320ms ease-out, opacity 180ms ease-out",
        }}
      >
        <div className="mb-3 flex items-center justify-start">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300 underline decoration-slate-500/70 underline-offset-4">
            <Lightbulb className="h-5 w-5 text-cyan-300" />
            <span>Interaction Tips</span>
          </p>
        </div>

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label="Collapse interaction tips"
          title="Collapse tips"
          className={`absolute right-2 top-1/2 -translate-y-1/2 ${toggleButtonClass}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="space-y-2 text-sm text-slate-200">
          <div className="ml-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              <span className="text-slate-200">Company</span>
            </span>
            <span className="text-slate-500">/</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3cb371]" />
              <span className="text-slate-200">Use case</span>
            </span>
            <span className="text-slate-500">/</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-yellow-300/70" />
              <span className="text-slate-200">New</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Hand className="h-4 w-4 text-cyan-300" />
            <span>Drag to rotate the globe</span>
          </div>
          <div className="flex items-center gap-2">
            <ZoomIn className="h-4 w-4 text-cyan-300" />
            <span>Scroll to zoom in or out</span>
          </div>
          <div className="flex items-center gap-2">
            <MousePointer2 className="h-4 w-4 text-cyan-300" />
            <span>Click markers to open details</span>
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-cyan-300" />
            <span>Please wait while details load</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
