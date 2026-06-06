import Link from "next/link"
import type { IndustrySummary } from "@/lib/data-industries"

function formatCount(value: number): string {
  return value.toLocaleString()
}

function formatShare(count: number, total: number): string {
  if (total <= 0) return "0%"
  return `${((count / total) * 100).toFixed(1)}%`
}

export function IndustryUseCaseOverview({ industries }: { industries: IndustrySummary[] }) {
  const totalUseCases = industries.reduce((sum, industry) => sum + industry.useCaseCount, 0)
  const topIndustries = industries.slice(0, 12)
  const otherIndustries = industries.slice(12)
  const otherUseCaseCount = otherIndustries.reduce((sum, industry) => sum + industry.useCaseCount, 0)
  const palette = [
    "#43cc93",
    "#38bdf8",
    "#a78bfa",
    "#facc15",
    "#fb7185",
    "#2dd4bf",
    "#f97316",
    "#60a5fa",
    "#c084fc",
    "#f472b6",
    "#34d399",
    "#fde047",
  ]
  const segments = [
    ...topIndustries.map((industry, index) => ({
      color: palette[index],
      count: industry.useCaseCount,
      href: `/industries/${industry.slug}`,
      key: industry.slug,
      name: industry.name,
    })),
    ...(otherUseCaseCount > 0
      ? [
          {
            color: "#64748b",
            count: otherUseCaseCount,
            href: "",
            key: "other-industries",
            name: `Other industries (${formatCount(otherIndustries.length)})`,
          },
        ]
      : []),
  ]

  return (
    <section className="mb-4 rounded-lg border border-slate-800 bg-[#171717] px-4 py-3">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Industry mix
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {formatCount(totalUseCases)} use cases across {formatCount(industries.length)} industries
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Top {formatCount(topIndustries.length)} + other industries
        </p>
      </div>

      <div className="flex h-5 items-center rounded-full bg-slate-900">
        {segments.map((segment, index) => {
          const width = `${(segment.count / Math.max(totalUseCases, 1)) * 100}%`
          const tooltip = `${segment.name}: ${formatCount(segment.count)} use cases · ${formatShare(
            segment.count,
            totalUseCases
          )}`
          const className = [
            "group relative h-3 transition-opacity hover:opacity-85 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43cc93]/60",
            index === 0 ? "rounded-l-full" : "",
            index === segments.length - 1 ? "rounded-r-full" : "",
          ]
            .filter(Boolean)
            .join(" ")
          const tooltipNode = (
            <span className="pointer-events-none absolute bottom-[calc(100%+0.55rem)] left-1/2 z-20 hidden w-max max-w-[14rem] -translate-x-1/2 rounded-md border border-slate-700 bg-[#0f0f0f] px-2.5 py-1.5 text-left text-[11px] leading-snug text-slate-200 shadow-xl group-hover:block group-focus-visible:block">
              <span className="block font-semibold text-[#f5f5f5]">{segment.name}</span>
              <span className="mt-0.5 block text-slate-400">
                {formatCount(segment.count)} use cases · {formatShare(segment.count, totalUseCases)}
              </span>
            </span>
          )

          return segment.href ? (
            <Link
              key={segment.key}
              href={segment.href}
              className={className}
              style={{ width, backgroundColor: segment.color }}
              title={tooltip}
              aria-label={tooltip}
            >
              {tooltipNode}
            </Link>
          ) : (
            <div
              key={segment.key}
              className={className}
              style={{ width, backgroundColor: segment.color }}
              title={tooltip}
              aria-label={tooltip}
            >
              {tooltipNode}
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {segments.map((segment) => {
          const content = (
            <>
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="max-w-[10rem] truncate text-slate-300 transition-colors group-hover:text-[#43cc93]">
                {segment.name}
              </span>
              <span className="font-semibold tabular-nums text-slate-100">
                {formatCount(segment.count)}
              </span>
            </>
          )

          return segment.href ? (
            <Link
              key={segment.key}
              href={segment.href}
              className="group inline-flex items-center gap-2 text-xs"
            >
              {content}
            </Link>
          ) : (
            <span key={segment.key} className="inline-flex items-center gap-2 text-xs">
              {content}
            </span>
          )
        })}
      </div>
    </section>
  )
}
