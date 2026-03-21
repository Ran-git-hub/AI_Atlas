"use client"

import { Database, MapPin, Layers } from "lucide-react"

export function StatsBar() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
      <div className="flex items-center gap-6 px-6 py-3 rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-700/50">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-cyan-400" />
          <span className="text-sm text-slate-300">
            <span className="font-semibold text-white">12</span> 案例
          </span>
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-cyan-400" />
          <span className="text-sm text-slate-300">
            <span className="font-semibold text-white">8</span> 国家
          </span>
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <span className="text-sm text-slate-300">
            <span className="font-semibold text-white">6</span> 类别
          </span>
        </div>
      </div>
    </div>
  )
}
