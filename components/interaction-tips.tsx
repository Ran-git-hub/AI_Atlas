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
      className={`pointer-events-auto fixed left-[max(0px,env(safe-area-inset-left,0px))] top-1/2 z-30 block -translate-y-1/2 overflow-visible rounded-2xl border border-slate-600/45 bg-slate-950/70 shadow-lg shadow-black/20 backdrop-blur-xl transition-[width] duration-300 ease-out md:left-[max(0.75rem,env(safe-area-inset-left,0px))] ${
        collapsed ? "h-36 w-12" : "w-fit max-w-[calc(100%-1rem)]"
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
        className={`inline-block w-max min-w-0 max-w-full max-h-[min(60vh,24rem)] overflow-y-auto p-4 transition-opacity duration-200 ease-out [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          collapsed ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
        }`}
        style={{
          clipPath: collapsed ? "inset(0 100% 0 0)" : "inset(0 0 0 0)",
          transition: "clip-path 320ms ease-out, opacity 180ms ease-out",
        }}
      >
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-700/45 pb-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Lightbulb className="h-5 w-5 shrink-0 text-cyan-300" />
            <h2 className="min-w-0 truncate text-sm font-semibold uppercase tracking-wider text-slate-200">
              Interaction Tips
            </h2>
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Collapse interaction tips"
            title="Collapse tips"
            className={`shrink-0 ${toggleButtonClass}`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-slate-200">
          <section className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Markers
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400" />
                <span className="min-w-0 break-words">Company/Organization</span>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#3cb371]" />
                  <span>Use case</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-yellow-300/70" />
                  <span>New</span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-2.5">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Controls
            </h3>
            <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
              <Hand className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300 sm:mt-0" />
              <span className="min-w-0 flex-1 break-words leading-snug">
                Drag to rotate
              </span>
            </div>
            <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
              <ZoomIn className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300 sm:mt-0" />
              <span className="min-w-0 flex-1 break-words leading-snug">
                Scroll to zoom
              </span>
            </div>
            <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
              <MousePointer2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300 sm:mt-0" />
              <span className="min-w-0 flex-1 break-words leading-snug">
                Click marker for details
              </span>
            </div>
            <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300 sm:mt-0" />
              <span className="min-w-0 flex-1 break-words leading-snug">
                Wait while details load
              </span>
            </div>
          </section>
        </div>
      </div>
    </aside>
  )
}
