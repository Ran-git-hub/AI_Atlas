"use client"

import Link from "next/link"
import type { WeeklyReportListItem } from "@/lib/types-weekly-report"

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart + "T00:00:00")
  const end = new Date(weekEnd + "T00:00:00")
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`
}

export function WeeklyReportCard({ report }: { report: WeeklyReportListItem }) {
  const slug = `weekly-${report.weekStart}`

  return (
    <Link href={`/blog/${slug}`} className="group block">
      <article className="rounded-lg border border-slate-800 bg-[#1a1a1a] px-4 py-3 transition-all hover:border-cyan-500/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Week range + date */}
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
              <span className="text-cyan-400">{formatWeekRange(report.weekStart, report.weekEnd)}</span>
            </div>

            {/* Title */}
            <h3 className="mb-1 text-sm font-semibold text-[#f5f5f5] transition-colors group-hover:text-cyan-400">
              {report.title}
            </h3>

            {/* Summary */}
            {report.summary && (
              <p className="line-clamp-1 text-xs text-slate-400">{report.summary}</p>
            )}

            {/* Tags + stats row */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {report.tags && report.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-400">
                  {tag}
                </span>
              ))}
              {report.tags && report.tags.length > 4 && (
                <span className="text-[10px] text-slate-500">+{report.tags.length - 4}</span>
              )}
              <span className="ml-auto text-[10px] text-slate-500">
                <span className="text-cyan-400">{report.newUseCasesCount}</span> cases
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
