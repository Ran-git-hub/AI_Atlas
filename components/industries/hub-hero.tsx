import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import { AtlasAppTopRow } from "@/components/atlas-app-top-row"

const shellPad =
  "mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]"

export function HubHero({
  accent,
  crumbs,
  eyebrow,
  titleLead,
  titleAccent,
  stats,
  children,
}: {
  accent: string
  crumbs: { name: string; href?: string }[]
  eyebrow: string[]
  titleLead: string
  titleAccent: string
  stats: { label: string; value: number | string }[]
  children?: ReactNode
}) {
  return (
    <div className="relative isolate bg-[#101010]" style={{ "--accent": accent } as CSSProperties}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]"
      />

      <div className={shellPad}>
        <AtlasAppTopRow activeView="industries" />
        <div className="mt-4 w-full min-w-0 border-t border-slate-800/80 pb-6 pt-6 md:pb-10 md:pt-9">
          <nav
            aria-label="Breadcrumb"
            className="mb-7 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-slate-500"
          >
            {crumbs.map((crumb, index) => (
              <span key={crumb.name} className="flex items-center gap-2">
                {index > 0 ? <span className="text-slate-700">/</span> : null}
                {crumb.href ? (
                  <Link href={crumb.href} className="transition-colors hover:text-[var(--accent)]">
                    {crumb.name}
                  </Link>
                ) : (
                  <span className="text-slate-300">{crumb.name}</span>
                )}
              </span>
            ))}
          </nav>

          <div className="border-l-2 border-[var(--accent)] pl-4 md:pl-6">
            <p className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              {eyebrow.map((part, index) => (
                <span key={part} className="flex items-center gap-2.5">
                  {index > 0 ? <span aria-hidden="true" className="h-1 w-1 bg-slate-600" /> : null}
                  <span className={index === 0 ? "text-[var(--accent)]" : undefined}>{part}</span>
                </span>
              ))}
            </p>
            <h1 className="hub-rise max-w-5xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-[#f5f5f5] md:text-6xl">
              {titleLead} <span className="text-[var(--accent)]">{titleAccent}</span>
            </h1>
            {children ? (
              <div className="mt-5 max-w-3xl space-y-3 text-pretty text-base leading-relaxed text-slate-300">
                {children}
              </div>
            ) : null}
          </div>

          <dl className="mt-9 grid grid-cols-2 border-l border-t border-white/10 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={stat.label} className="flex flex-col gap-2 border-b border-r border-white/10 bg-[#101010]/90 px-4 py-4 md:px-5">
                <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">{stat.label}</dt>
                <dd
                  className={
                    typeof stat.value === "number"
                      ? `font-mono text-3xl font-medium tabular-nums leading-none md:text-[2.75rem] ${index === 0 ? "text-[var(--accent)]" : "text-[#f5f5f5]"}`
                      : "font-mono text-lg font-medium uppercase leading-tight text-[#f5f5f5] md:text-2xl"
                  }
                >
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div aria-hidden="true" className="hub-ruler w-full border-b border-white/10" />
    </div>
  )
}
