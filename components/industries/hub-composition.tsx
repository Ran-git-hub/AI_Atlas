import Link from "next/link"
import type { CSSProperties } from "react"
import { HubHeading } from "@/components/industries/hub-heading"

function shade(index: number): number {
  return Math.max(0.25, 1 - index * 0.14)
}

export function HubComposition({
  title,
  items,
  accent,
}: {
  title: string
  items: { name: string; count: number; href: string }[]
  accent: string
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0)

  return (
    <section className="hub-frame min-w-0 p-5" style={{ "--accent": accent } as CSSProperties}>
      <HubHeading aside={`${items.length} / ${total.toLocaleString()}`}>{title}</HubHeading>
      <div className="mt-5 flex h-10 w-full gap-px">
        {items.map((item, index) => (
          <Link
            key={item.name}
            href={item.href}
            title={`${item.name}: ${item.count.toLocaleString()}`}
            className="hub-grow min-w-[5px] basis-0 bg-[var(--accent)] transition-[filter] hover:brightness-125"
            style={{ flexGrow: item.count, opacity: shade(index) }}
          >
            <span className="sr-only">{item.name}</span>
          </Link>
        ))}
      </div>
      <div aria-hidden="true" className="mt-1 flex justify-between border-t border-white/15 pt-1 font-mono text-[11px] tabular-nums text-slate-600">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100%</span>
      </div>
      <ul className="mt-5 grid gap-x-10 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <li key={item.name} className="min-w-0 border-b border-dashed border-white/10 pb-2.5">
            <Link href={item.href} className="group flex items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 bg-[var(--accent)]" style={{ opacity: shade(index) }} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-100 transition-colors group-hover:text-[var(--accent)]">
                {item.name}
              </span>
              <span className="shrink-0 font-mono text-sm tabular-nums text-slate-300">
                {item.count.toLocaleString()}
                <span className="ml-2 inline-block w-8 text-right text-xs text-slate-500">
                  {Math.round((item.count / total) * 100)}%
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
