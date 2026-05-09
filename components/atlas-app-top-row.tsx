"use client"

import { AtlasQuickHelpDialog } from "@/components/atlas-quick-help-dialog"
import { AtlasSiteBrandStrip } from "@/components/atlas-site-brand-strip"
import { ViewNavigation, type AtlasView } from "@/components/view-navigation"
import { cn } from "@/lib/utils"

/** Shared header chrome so Globe / Use Cases / Industries align when switching routes. */
export function AtlasAppTopRow({
  activeView,
  className,
}: {
  activeView: AtlasView
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative w-full min-w-0 atlas-header:grid atlas-header:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] atlas-header:items-center atlas-header:gap-x-3 atlas-header:gap-y-2",
        className,
      )}
    >
      <div className="hidden min-w-0 atlas-header:block" aria-hidden="true" />
      <div className="flex min-w-0 max-w-full flex-row flex-wrap items-center gap-x-3 gap-y-2 overflow-visible overscroll-x-contain pr-[2.875rem] [-ms-overflow-style:none] [scrollbar-width:none] atlas-header:justify-center atlas-header:pr-0 [&::-webkit-scrollbar]:hidden">
        <AtlasSiteBrandStrip className="min-w-0 shrink-0" />
        <div className="flex min-w-0 basis-full justify-center atlas-header:min-w-fit atlas-header:basis-auto">
          <ViewNavigation activeView={activeView} />
        </div>
      </div>
      <div className="absolute right-0 top-0 z-10 atlas-header:relative atlas-header:top-auto atlas-header:right-auto atlas-header:flex atlas-header:min-w-0 atlas-header:justify-end atlas-header:self-center">
        <AtlasQuickHelpDialog />
      </div>
    </div>
  )
}
