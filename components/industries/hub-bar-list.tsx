import Link from "next/link"
import type { CSSProperties } from "react"
import { HubHeading } from "@/components/industries/hub-heading"

export function HubBarList({
  title,
  items,
  accent,
}: {
  title: string
  items: { name: string; count: number; href?: string }[]
  accent: string
}) {
  const max = Math.max(1, ...items.map((item) => item.count))

  return (
    <section className="hub-frame min-w-0 p-5" style={{ "--accent": accent } as CSSProperties}>
      <HubHeading>{title}</HubHeading>
      {items.length > 0 ? (
        <ol className="mt-5 space-y-3.5">
          {items.map((item, index) => (
            <li key={item.name}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-3">
                  <span className="font-mono text-xs tabular-nums text-slate-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="truncate text-sm font-medium text-slate-100 transition-colors hover:text-[var(--accent)]"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span className="truncate text-sm font-medium text-slate-100">{item.name}</span>
                  )}
                </span>
                <span className="shrink-0 font-mono text-sm tabular-nums text-slate-300">
                  {item.count.toLocaleString()}
                </span>
              </div>
              <div className="hub-cells mt-2 h-2 bg-white/[0.08]">
                <div
                  className="hub-grow h-full bg-[var(--accent)]"
                  style={{ width: `${Math.max(3, (item.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No data available yet.</p>
      )}
    </section>
  )
}
