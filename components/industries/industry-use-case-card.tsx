import Link from "next/link"
import type { UseCaseCatalogRow } from "@/lib/types"
import { isUseCasePendingValidation, useCaseDisplayName } from "@/lib/types"

import { formatAtlasDate } from "@/lib/format-date"
function formatDate(value: string | null | undefined): string {
  if (!value) return "Unknown date"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown date"
  return formatAtlasDate(date)
}

export function IndustryUseCaseCard({ useCase }: { useCase: UseCaseCatalogRow }) {
  const title = useCaseDisplayName(useCase)
  const date = formatDate(useCase.updated_at || useCase.created_at)
  const isPending = isUseCasePendingValidation(useCase)

  return (
    <Link href={`/use-cases/${encodeURIComponent(useCase.id)}`} className="group block">
      <article className="rounded-xl border border-slate-800 bg-[#1a1a1a] p-4 transition-all hover:border-[#43cc93]/45 hover:bg-[#1f1f1f]">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {useCase.company_name ? (
            <span className="font-medium text-[#43cc93]">{useCase.company_name}</span>
          ) : null}
          {useCase.country ? <span>{useCase.country}</span> : null}
          <span>{date}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="line-clamp-2 min-w-0 text-base font-semibold leading-snug text-[#f5f5f5] transition-colors group-hover:text-[#43cc93]">
            {title}
          </h3>
          {isPending ? (
            <span className="shrink-0 rounded-full border border-sky-300/45 bg-sky-300/12 px-2 py-0.5 text-[10px] font-semibold text-sky-100">
              To be validated
            </span>
          ) : null}
        </div>
        {useCase.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">
            {useCase.description}
          </p>
        ) : null}
      </article>
    </Link>
  )
}
