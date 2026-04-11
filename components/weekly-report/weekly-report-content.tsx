import Link from "next/link"
import type { WeeklyReportContent } from "@/lib/types-weekly-report"
import { WeeklyReportStats } from "./weekly-report-stats"
import { WeeklyReportHighlightCard } from "./weekly-report-highlight"

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="text-cyan-400">{icon}</div>
      <h2 className="text-base font-semibold text-[#f5f5f5]">{title}</h2>
    </div>
  )
}

export function WeeklyReportContentRenderer({
  content,
  relatedCaseIds,
}: {
  content: WeeklyReportContent
  relatedCaseIds: string[]
}) {
  return (
    <div className="space-y-6">

      {/* Overview Stats */}
      <section>
        <WeeklyReportStats overview={content.overview} />
      </section>

      {/* Highlights */}
      {content.highlights && content.highlights.length > 0 && (
        <section>
          <SectionHeader
            title="Highlights"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
          />
          <div className="grid gap-2 md:grid-cols-2">
            {content.highlights.map((h) => (
              <WeeklyReportHighlightCard key={h.id} highlight={h} />
            ))}
          </div>
        </section>
      )}

      {/* Trends */}
      {content.trends && content.trends.length > 0 && (
        <section>
          <SectionHeader
            title="Trends"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          <div className="space-y-1.5">
            {content.trends.map((t, i) => (
              <div key={i} className="rounded-lg border border-slate-800 bg-[#1a1a1a] px-3 py-2">
                <h4 className="mb-0.5 text-sm font-medium text-cyan-400">{t.title}</h4>
                <p className="text-xs text-slate-400">{t.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search Strategy */}
      {content.searchStrategy && (
        <section>
          <SectionHeader
            title="Search Strategy"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          {content.searchStrategy.queryPerformance && content.searchStrategy.queryPerformance.length > 0 && (
            <div className="mb-3 space-y-1.5">
              <h3 className="text-xs font-medium text-slate-300">Query Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-slate-400">
                      <th className="pb-1.5 pr-3 font-medium">Query</th>
                      <th className="pb-1.5 pr-3 font-medium">Hit</th>
                      <th className="pb-1.5 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.searchStrategy.queryPerformance.map((q, i) => (
                      <tr key={i} className="border-b border-slate-800/50 text-slate-300">
                        <td className="py-1.5 pr-3 font-mono text-[10px]">{q.query}</td>
                        <td className="py-1.5 pr-3">
                          <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-400">{q.hitRate}</span>
                        </td>
                        <td className="py-1.5 text-slate-400">{q.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {content.searchStrategy.newQueriesAdded && content.searchStrategy.newQueriesAdded.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-medium text-slate-300">New Queries Added</h3>
              <div className="flex flex-wrap gap-1.5">
                {content.searchStrategy.newQueriesAdded.map((q, i) => (
                  <span key={i} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">{q}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Data Quality */}
      {content.dataQuality && content.dataQuality.issues && content.dataQuality.issues.length > 0 && (
        <section>
          <SectionHeader
            title="Data Quality"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <div className="space-y-1.5">
            {content.dataQuality.issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-800 bg-[#1a1a1a] px-3 py-2">
                <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-amber-500/10 text-[10px] font-bold text-amber-400">{issue.count}</span>
                <div>
                  <p className="text-xs font-medium text-[#f5f5f5]">{issue.issue}</p>
                  <p className="text-[10px] text-slate-400">{issue.handling}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Insights */}
      {content.insights && content.insights.length > 0 && (
        <section>
          <SectionHeader
            title="Insights"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
          />
          <ul className="space-y-1.5">
            {content.insights.map((insight, i) => (
              <li key={i} className="flex gap-2 rounded-lg border border-slate-800 bg-[#1a1a1a] px-3 py-2">
                <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-cyan-400" />
                <p className="text-xs text-slate-300">{insight}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Next Week Plan */}
      {content.nextWeekPlan && content.nextWeekPlan.length > 0 && (
        <section>
          <SectionHeader
            title="Next Week Plan"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <ul className="space-y-1.5">
            {content.nextWeekPlan.map((item, i) => (
              <li key={i} className="flex gap-2 rounded-lg border border-slate-800 bg-[#1a1a1a] px-3 py-2">
                <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-cyan-500/10 text-[10px] font-medium text-cyan-400">{i + 1}</span>
                <p className="text-xs text-slate-300">{item}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Related Use Cases */}
      {relatedCaseIds && relatedCaseIds.length > 0 && (
        <section>
          <SectionHeader
            title="Related Use Cases"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            }
          />
          <div className="flex flex-wrap gap-1.5">
            {relatedCaseIds.slice(0, 20).map((id) => (
              <Link
                key={id}
                href={`/use-cases?id=${id}`}
                className="rounded-lg border border-slate-800 bg-[#1a1a1a] px-2 py-1 text-[10px] text-cyan-400 transition-colors hover:border-cyan-500/40"
              >
                {id.slice(0, 8)}…
              </Link>
            ))}
            {relatedCaseIds.length > 20 && (
              <span className="px-2 py-1 text-[10px] text-slate-500">+{relatedCaseIds.length - 20} more</span>
            )}
          </div>
        </section>
      )}

    </div>
  )
}
