import Link from "next/link"
import type { WeeklyReportHighlight } from "@/lib/types-weekly-report"

export function WeeklyReportHighlightCard({ highlight }: { highlight: WeeklyReportHighlight }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#1a1a1a] px-3 py-2.5">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-[#f5f5f5]">{highlight.title}</h4>
        {highlight.use_case_id && (
          <Link href={`/use-cases?id=${highlight.use_case_id}`} className="flex-shrink-0 text-[10px] text-cyan-400 hover:text-cyan-300">
            → case
          </Link>
        )}
      </div>

      <p className="mb-2 line-clamp-2 text-xs text-slate-400">{highlight.description}</p>

      <div className="flex flex-wrap gap-1">
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">{highlight.company}</span>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">{highlight.country}</span>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">{highlight.industry}</span>
        {highlight.significance && (
          <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-400">{highlight.significance}</span>
        )}
      </div>
    </div>
  )
}
