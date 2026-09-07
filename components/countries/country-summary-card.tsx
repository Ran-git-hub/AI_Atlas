import Link from "next/link"
import type { CountrySummary } from "@/lib/data-countries"

export function CountrySummaryCard({ country }: { country: CountrySummary }) {
  const leadIndustry = country.topIndustries[0]

  return (
    <Link href={`/countries/${country.slug}`} className="group block">
      <article className="h-full rounded-xl border border-slate-800 bg-[#1a1a1a] p-4 transition-all hover:border-[#43cc93]/45 hover:bg-[#1f1f1f]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#43cc93]/80">
              Country/Region
            </p>
            <h2 className="line-clamp-2 text-lg font-semibold leading-tight text-[#f5f5f5] transition-colors group-hover:text-[#43cc93]">
              {country.name}
            </h2>
          </div>
          <span className="shrink-0 rounded-full border border-[#43cc93]/25 bg-[#43cc93]/10 px-2.5 py-1 text-xs font-medium leading-none text-[#43cc93]">
            {country.useCaseCount.toLocaleString()} cases
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
          <span>{country.companyCount.toLocaleString()} organizations</span>
          <span>{country.industryCount.toLocaleString()} industries</span>
        </div>
        {leadIndustry ? (
          <p className="mt-2 truncate text-sm text-slate-500">
            Led by {leadIndustry.name}
          </p>
        ) : null}
      </article>
    </Link>
  )
}
