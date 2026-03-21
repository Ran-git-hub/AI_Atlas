"use client"

import { X, ExternalLink, MapPin, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AICaseData } from "@/components/globe/globe-view"

interface DetailPanelProps {
  caseData: AICaseData | null
  onClose: () => void
}

export function DetailPanel({ caseData, onClose }: DetailPanelProps) {
  if (!caseData) return null

  return (
    <div
      className={`fixed right-0 top-0 h-full w-full max-w-md transform transition-transform duration-500 ease-out z-50 ${
        caseData ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Glassmorphism panel */}
      <div className="h-full m-4 rounded-2xl overflow-hidden backdrop-blur-xl bg-slate-900/70 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
        {/* Header */}
        <div className="relative">
          {/* Image */}
          <div className="h-48 overflow-hidden">
            <img
              src={caseData.image}
              alt={caseData.name}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900/70 text-white"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Category badge */}
          <div className="absolute bottom-4 left-4">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 backdrop-blur-sm">
              {caseData.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-white text-balance">{caseData.name}</h2>
          </div>

          {/* Meta info */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="h-4 w-4 text-cyan-400" />
              <span className="text-sm">{caseData.city}, {caseData.country}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Tag className="h-4 w-4 text-cyan-400" />
              <span className="text-sm">{caseData.category}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">About</h3>
            <p className="text-slate-300 leading-relaxed">{caseData.description}</p>
          </div>

          {/* Link button */}
          <a
            href={caseData.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
          >
            <span>Visit Website</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Bottom glow effect */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}
