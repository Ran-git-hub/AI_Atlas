"use client"

import { Search, SlidersHorizontal, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SearchBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 backdrop-blur-sm border border-cyan-500/30 flex items-center justify-center">
              <Globe className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="font-semibold text-white hidden sm:block">AI Atlas</span>
          </div>

          {/* Search input */}
          <div className="flex-1 min-w-0 relative sm:max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search ..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-800/60 backdrop-blur-md border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
          </div>

          {/* Filter button */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 w-11 h-11 rounded-xl bg-slate-800/60 backdrop-blur-md border border-slate-700/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-slate-800/80"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
