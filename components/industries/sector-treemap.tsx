import Link from "next/link"
import type { CSSProperties } from "react"
import type { SectorGroup } from "@/lib/data-industries"
import { squarify } from "@/lib/treemap"

const WIDTH = 1000
const HEIGHT = 460
const HEADER = 26

const percent = (value: number, of: number) => `${(value / of) * 100}%`

export function SectorTreemap({ groups }: { groups: SectorGroup[] }) {
  const sectors = squarify(
    groups.map((group) => ({ group, value: group.useCaseCount })),
    { x: 0, y: 0, w: WIDTH, h: HEIGHT },
  )

  return (
    <div className="relative hidden w-full lg:block" style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}>
      {sectors.map(({ group, x, y, w, h }) => {
        const position = {
          left: percent(x, WIDTH),
          top: percent(y, HEIGHT),
          width: percent(w, WIDTH),
          height: percent(h, HEIGHT),
          "--accent": group.accent,
        } as CSSProperties
        const href = group.slug ? `/sectors/${group.slug}` : undefined
        const compact = w < 80 || h < 70

        if (compact) {
          const label = (
            <span className="flex h-full w-full items-center justify-center overflow-hidden border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent)_22%,#121212)] px-1 text-center text-[11px] font-semibold uppercase leading-tight tracking-wide text-[var(--accent)] transition-[filter] group-hover/sector:brightness-125">
              {w >= 56 && h >= 30 ? group.name : <span className="sr-only">{group.name}</span>}
            </span>
          )
          return href ? (
            <Link
              key={group.name}
              href={href}
              title={`${group.name}: ${group.useCaseCount.toLocaleString()}`}
              className="group/sector absolute p-[2px]"
              style={position}
            >
              {label}
            </Link>
          ) : (
            <div key={group.name} className="group/sector absolute p-[2px]" style={position}>
              {label}
            </div>
          )
        }

        const inner = { x: 0, y: 0, w, h: h - HEADER }
        const max = Math.max(1, ...group.industries.map((industry) => industry.useCaseCount))
        const tiles = squarify(
          group.industries.map((industry) => ({ industry, value: industry.useCaseCount })),
          inner,
        )

        return (
          <div key={group.name} className="absolute p-[2px]" style={position}>
            <div className="flex h-full w-full flex-col overflow-hidden border border-[color-mix(in_srgb,var(--accent)_32%,transparent)] bg-[color-mix(in_srgb,var(--accent)_5%,#121212)]">
              <div className="flex h-[26px] shrink-0 items-center justify-between gap-2 px-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
                {href ? (
                  <Link href={href} className="truncate transition-colors hover:text-white">
                    {group.name}
                  </Link>
                ) : (
                  <span className="truncate">{group.name}</span>
                )}
                <span className="font-mono tabular-nums">{group.useCaseCount.toLocaleString()}</span>
              </div>
              <div className="relative flex-1">
                {tiles.map(({ industry, x: tx, y: ty, w: tw, h: th }) => {
                  const tone = 16 + 34 * (industry.useCaseCount / max)
                  const showName = tw >= 78 && th >= 40
                  const showCount = tw >= 30 && th >= 20
                  return (
                    <Link
                      key={industry.slug}
                      href={`/industries/${industry.slug}`}
                      title={`${industry.name}: ${industry.useCaseCount.toLocaleString()}`}
                      className="absolute p-px"
                      style={{
                        left: percent(tx, inner.w),
                        top: percent(ty, inner.h),
                        width: percent(tw, inner.w),
                        height: percent(th, inner.h),
                      }}
                    >
                      <span
                        className="flex h-full w-full flex-col justify-between overflow-hidden p-1.5 transition-[filter] hover:brightness-150"
                        style={{ background: `color-mix(in srgb, ${group.accent} ${tone}%, transparent)` }}
                      >
                        <span
                          className={
                            showName ? "line-clamp-2 text-xs font-medium leading-tight text-white" : "sr-only"
                          }
                        >
                          {industry.name}
                        </span>
                        {showCount ? (
                          <span className="font-mono text-xs tabular-nums text-white/75">
                            {industry.useCaseCount.toLocaleString()}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
