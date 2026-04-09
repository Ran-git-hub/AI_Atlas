import { cn } from "@/lib/utils"

export const ATLAS_SITE_TAGLINE =
  "Daily updates on real-world AI deployments worldwide." as const

export function AtlasSiteTagline({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-balance text-center text-xs font-medium leading-snug tracking-wide text-cyan-200/80 antialiased sm:text-left sm:text-sm",
        className,
      )}
    >
      {ATLAS_SITE_TAGLINE}
    </p>
  )
}
