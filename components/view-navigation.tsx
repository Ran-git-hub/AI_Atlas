import Link from "next/link"
import { cn } from "@/lib/utils"

export type AtlasView = "globe" | "use-cases" | "industries"

const VIEWS: Array<{ id: AtlasView; label: string; href: string }> = [
  { id: "globe", label: "Globe", href: "/" },
  { id: "use-cases", label: "Use Cases", href: "/use-cases" },
  { id: "industries", label: "Industries", href: "/industries" },
]

export function ViewNavigation({
  activeView,
  className,
}: {
  activeView: AtlasView
  className?: string
}) {
  return (
    <nav
      aria-label="AI Atlas views"
      className={cn(
        "pointer-events-auto flex w-fit max-w-full items-center justify-start overflow-x-auto rounded-full border border-white/10 bg-slate-950/45 p-1.5 backdrop-blur-md [-ms-overflow-style:none] [scrollbar-width:none] max-atlas-header:w-full [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      <span className="shrink-0 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 atlas-header:text-xs">
        View Switcher
      </span>
      <div className="flex min-w-max items-center gap-1">
        {VIEWS.map((view) => {
          const active = view.id === activeView
          const greenView = view.id === "use-cases" || view.id === "industries"
          return (
            <Link
              key={view.id}
              href={view.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212] atlas-header:text-sm",
                active
                  ? greenView
                    ? "border border-[#43cc93]/35 bg-[#43cc93]/15 text-[#7ee2b5] shadow-[0_0_0_1px_rgba(67,204,147,0.18)] focus-visible:ring-[#43cc93]/60"
                    : "border border-cyan-300/45 bg-cyan-400/20 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.2)] focus-visible:ring-cyan-400/60"
                  : greenView
                    ? "border border-transparent text-slate-300 hover:bg-[#43cc93]/10 hover:text-[#43cc93] focus-visible:ring-[#43cc93]/45"
                    : "border border-transparent text-slate-300 hover:bg-cyan-400/10 hover:text-cyan-200 focus-visible:ring-cyan-400/45",
              )}
            >
              {view.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
