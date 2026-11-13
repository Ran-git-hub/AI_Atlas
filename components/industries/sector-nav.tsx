import Link from "next/link"
import type { CSSProperties } from "react"
import { HubHeading } from "@/components/industries/hub-heading"
import type { SectorGroup } from "@/lib/data-industries"

export function SectorNav({ groups, current }: { groups: SectorGroup[]; current?: string }) {
  return (
    <nav aria-label="Sectors" className="hub-frame p-5">
      <HubHeading>All sectors</HubHeading>
      <ul className="mt-5 grid grid-cols-1 gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {groups
          .filter((group) => group.slug)
          .map((group) => (
            <li key={group.name} style={{ "--accent": group.accent } as CSSProperties}>
              <Link
                href={`/sectors/${group.slug}`}
                aria-current={group.slug === current ? "page" : undefined}
                className="flex h-11 items-center gap-3 bg-[#141414] px-3 text-sm font-medium text-slate-200 transition-colors hover:bg-[#1b1b1b] hover:text-[var(--accent)] aria-[current=page]:bg-[#1b1b1b] aria-[current=page]:text-[var(--accent)]"
              >
                <span className="h-2 w-2 shrink-0 bg-[var(--accent)]" />
                <span className="min-w-0 flex-1 truncate">{group.name}</span>
                <span className="font-mono text-xs tabular-nums text-slate-500">
                  {group.useCaseCount.toLocaleString()}
                </span>
              </Link>
            </li>
          ))}
      </ul>
    </nav>
  )
}
