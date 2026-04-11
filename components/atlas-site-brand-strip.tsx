import { cn } from "@/lib/utils"
import { AtlasLogoMark } from "@/components/atlas-logo-mark"
import { AtlasSiteTagline } from "@/components/atlas-site-tagline"
import { ATLAS_TAGLINE_MOBILE_LINES } from "@/lib/atlas-mobile-header"

/** Logo + “AI Atlas” + tagline — matches Globe / Index top brand row (no view switch). */
export function AtlasSiteBrandStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex min-w-0 max-w-full flex-row flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] atlas-header:flex-wrap atlas-header:justify-center atlas-header:gap-x-3 atlas-header:gap-y-2 atlas-header:overflow-visible [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <AtlasLogoMark
          className="h-8 w-8 shrink-0 sm:h-10 sm:w-10 atlas-header:h-9 atlas-header:w-9"
          iconClassName="h-[1.35rem] w-[1.35rem] text-cyan-400 sm:h-[1.65rem] sm:w-[1.65rem] atlas-header:h-[1.45rem] atlas-header:w-[1.45rem]"
        />
        <span className="shrink-0 text-sm font-semibold tracking-tight text-white sm:text-base atlas-header:text-base atlas-header:text-lg">
          AI Atlas
        </span>
      </div>
      <p className="w-[8.25rem] shrink-0 text-[9px] font-medium leading-tight tracking-wide text-cyan-200/85 antialiased sm:w-[9rem] sm:text-[10px] atlas-header:hidden">
        <span className="block">{ATLAS_TAGLINE_MOBILE_LINES[0]}</span>
        {ATLAS_TAGLINE_MOBILE_LINES[1] ? (
          <span className="block">{ATLAS_TAGLINE_MOBILE_LINES[1]}</span>
        ) : null}
      </p>
      <AtlasSiteTagline className="hidden min-w-0 max-w-md atlas-header:block atlas-header:flex-[0_1_auto] atlas-header:text-center atlas-header:text-sm atlas-header:leading-snug atlas-header:tracking-wide" />
    </div>
  )
}
