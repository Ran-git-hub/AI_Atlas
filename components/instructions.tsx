"use client"

import { MousePointer2, ZoomIn, Navigation } from "lucide-react"

export function Instructions() {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-6 px-4 py-2 rounded-full bg-slate-900/50 backdrop-blur-sm border border-slate-800/50">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <MousePointer2 className="h-3 w-3" />
          <span>Drag to rotate</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <ZoomIn className="h-3 w-3" />
          <span>Scroll to zoom</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Navigation className="h-3 w-3" />
          <span>Click markers</span>
        </div>
      </div>
    </div>
  )
}
