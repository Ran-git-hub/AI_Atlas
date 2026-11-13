import Link from "next/link"
import type { CSSProperties } from "react"
import type { SectorGroup } from "@/lib/data-industries"

export function SectorPanel({ group }: { group: SectorGroup }) {
  const href = group.slug ? `/sectors/${group.slug}` : undefined
  const max = Math.max(1, ...group.industries.map((industry) => industry.useCaseCount))

  return (
    <section className="hub-frame p-5" style={{ "--accent": group.accent } as CSSProperties}>
      <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div className="min-w-0">
          <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
            {group.industries.length} {group.industries.length === 1 ? "industry" : "industries"}
          </p>
          <h2 className="text-xl font-semibold leading-tight text-[#f5f5f5]">
            {href ? (
              <Link href={href} className="transition-colors hover:text-[var(--accent)]">
                {group.name}
              </Link>
            ) : (
              group.name
            )}
          </h2>
        </div>
        <div className="shrink-0 font-mono text-4xl font-medium tabular-nums leading-none text-[var(--accent)]">
          {group.useCaseCount.toLocaleString()}
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {group.industries.map((industry) => (
          <li key={industry.slug}>
            <Link href={`/industries/${industry.slug}`} className="group block">
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium text-slate-200 transition-colors group-hover:text-[var(--accent)]">
                  {industry.name}
                </span>
                <span className="shrink-0 font-mono text-sm tabular-nums text-slate-400">
                  {industry.useCaseCount.toLocaleString()}
                </span>
              </span>
              <span className="hub-cells mt-1.5 block h-1.5 bg-white/[0.08]">
                <span
                  className="hub-grow block h-full bg-[var(--accent)]"
                  style={{ width: `${Math.max(3, (industry.useCaseCount / max) * 100)}%` }}
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {href ? (
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--accent)] transition-colors hover:text-white"
        >
          Open {group.name} <span aria-hidden="true">↗</span>
        </Link>
      ) : null}
    </section>
  )
}
