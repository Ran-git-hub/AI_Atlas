import { cn } from "@/lib/utils"

const TAGLINE = "Daily updates on real-world AI deployments worldwide."

export function AtlasSiteTagline({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-balance text-center text-xs font-medium leading-snug tracking-wide text-cyan-200/80 antialiased sm:text-left sm:text-sm",
        className,
      )}
    >
      {TAGLINE}
    </p>
  )
}
