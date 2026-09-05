import Link from "next/link"
import type { IndustrySummary } from "@/lib/data-industries"

function formatCount(value: number): string {
  return value.toLocaleString()
}

export function IndustrySummaryCard({ industry }: { industry: IndustrySummary }) {
  return (
    <Link href={`/industries/${industry.slug}`} className="group block">
      <article className="relative grid h-full min-h-[12rem] grid-rows-[5rem_3.25rem_1fr] gap-y-2 overflow-hidden rounded-xl border border-[#2f2f2f] bg-gradient-to-br from-[#1c1c1c] to-[#151515] p-4 shadow-[0_10px_30px_-24px_rgba(67,204,147,0.45)] transition-all hover:border-[#43cc93]/50 hover:shadow-[0_16px_38px_-24px_rgba(67,204,147,0.75)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#43cc93]/45 to-transparent" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#43cc93]/[0.05] blur-2xl" />
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 overflow-hidden">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#43cc93]/80">
              Industry
            </p>
            <h2 className="line-clamp-2 text-xl font-semibold leading-tight text-[#f5f5f5] transition-colors group-hover:text-[#43cc93]">
              {industry.name}
            </h2>
          </div>
          <span className="shrink-0 rounded-full border border-[#43cc93]/25 bg-[#43cc93]/10 px-2.5 py-1 text-xs font-medium leading-none text-[#43cc93]">
            {formatCount(industry.useCaseCount)} cases
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex h-[3.25rem] flex-col justify-center rounded-lg border border-white/[0.07] bg-black/20 px-3 py-1.5">
            <div className="text-lg font-semibold leading-none text-white">
              {formatCount(industry.companyCount)}
            </div>
            <div className="mt-1 text-xs leading-none text-slate-400">Organizations</div>
          </div>
          <div className="flex h-[3.25rem] flex-col justify-center rounded-lg border border-white/[0.07] bg-black/20 px-3 py-1.5">
            <div className="text-lg font-semibold leading-none text-white">
              {formatCount(industry.countryCount)}
            </div>
            <div className="mt-1 text-xs leading-none text-slate-400">Countries/Regions</div>
          </div>
        </div>

        {industry.topCountries.length > 0 ? (
          <div className="overflow-hidden">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Top countries/regions
            </p>
            <div className="flex min-h-[1.5rem] flex-wrap content-start gap-1">
              {industry.topCountries.map((country) => (
                <span
                  key={country.name}
                  className="rounded-md border border-[#43cc93]/10 bg-[#43cc93]/[0.06] px-2 py-0.5 text-xs leading-tight text-slate-300"
                >
                  {country.name} · {country.count}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </article>
    </Link>
  )
}
