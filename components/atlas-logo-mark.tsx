import { cn } from "@/lib/utils"

export function AtlasLogoMark({
  className,
  iconClassName,
}: {
  className?: string
  iconClassName?: string
} = {}) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-slate-800/80 backdrop-blur-sm md:h-9 md:w-9",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn("h-5 w-5 text-cyan-400 md:h-6 md:w-6", iconClassName)}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="8.4" />
        <path d="M7.3 8.4 13 6.8 16.7 14.8 7.3 8.4Z" />
        <circle cx="7.3" cy="8.4" r="0.9" />
        <circle cx="13" cy="6.8" r="0.9" />
        <circle cx="16.7" cy="14.8" r="0.9" />
      </svg>
    </div>
  )
}
