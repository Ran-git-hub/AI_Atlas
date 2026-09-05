import Link from "next/link"
import type { BlogPostRelatedItem } from "@/lib/types-blog"

import { formatAtlasDate, formatAtlasDateRange } from "@/lib/format-date"
function formatWeekRange(weekStart: string | null, weekEnd: string | null, publishedAt: string): string {
  if (weekStart && weekEnd) {
    return formatAtlasDateRange(`${weekStart}T00:00:00`, `${weekEnd}T00:00:00`)
  }

  return formatAtlasDate(publishedAt)
}

export function IndustryRelatedReports({ reports }: { reports: BlogPostRelatedItem[] }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#1a1a1a] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#f5f5f5]">Related Weekly Reports</h2>
          <p className="mt-1 text-sm text-slate-400">
            Weekly updates linked by related use cases, industry tags, or report text.
          </p>
        </div>
        <Link href="/blog" className="text-sm font-medium text-[#43cc93] transition-colors hover:text-[#7ee2b5]">
          Open blog →
        </Link>
      </div>

      {reports.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {reports.map((report) => (
            <Link key={report.id} href={`/blog/${report.slug}`} className="group block">
              <article className="flex h-full flex-col rounded-lg border border-slate-800 bg-[#121212] p-4 transition-colors hover:border-[#43cc93]/45">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[#43cc93]">
                    {formatWeekRange(report.weekStart, report.weekEnd, report.publishedAt)}
                  </span>
                  <span className="rounded bg-[#43cc93]/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-[#43cc93]">
                    Weekly
                  </span>
                </div>
                <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[#f5f5f5] transition-colors group-hover:text-[#43cc93]">
                  {report.title}
                </h3>
                {report.summary ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-400">
                    {report.summary}
                  </p>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                  {report.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded bg-white/[0.04] px-2 py-0.5 text-xs text-slate-400">
                      {tag}
                    </span>
                  ))}
                  <span className="ml-auto text-xs text-slate-500">
                    {report.newUseCasesCount.toLocaleString()} cases
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-slate-800 bg-[#121212] px-4 py-6 text-center text-sm text-slate-500">
          Related weekly reports will appear here as new posts are published with matching use cases or industry tags.
        </p>
      )}
    </section>
  )
}
