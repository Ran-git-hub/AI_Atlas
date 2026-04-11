import { Cog } from "lucide-react"
import { OpenUseCaseDetailButton } from "@/components/blog/open-use-case-detail-button"
import type { NextStep, WeeklyReportContent } from "@/lib/types-weekly-report"
import { cn } from "@/lib/utils"
import { WeeklyReportStats } from "./weekly-report-stats"
import { WeeklyReportHighlightCard } from "./weekly-report-highlight"

/** Matches `/use-cases` table chrome (use-cases-table.tsx). */
const INDEX_TABLE_BORDER = "#2f2f2f"
const INDEX_TABLE_SURFACE = "#181818"
const INDEX_USE_CASE_GREEN = "#43cc93"
/** Tailwind `cyan-400` — matches trend titles and weekly report cyan accents. */
const TRENDS_CYAN = "#22d3ee"

function WeeklyReportIndexPanel({
  children,
  glow = "green",
}: {
  children: React.ReactNode
  /** Outer shadow tint: green for Index use-case theme, cyan for Trends. */
  glow?: "green" | "cyan"
}) {
  return (
    <section
      className={cn(
        "rounded-xl border p-4",
        glow === "cyan"
          ? "shadow-[0_8px_24px_-18px_rgba(34,211,238,0.55)]"
          : "shadow-[0_8px_24px_-18px_rgba(30,215,96,0.6)]",
      )}
      style={{
        borderColor: INDEX_TABLE_BORDER,
        backgroundColor: INDEX_TABLE_SURFACE,
      }}
    >
      {children}
    </section>
  )
}

function SectionHeader({
  title,
  icon,
  compact,
  titleClassName,
  iconClassName,
  titleStyle,
  iconWrapperStyle,
}: {
  title: string
  icon: React.ReactNode
  /** Nested blocks inside Under the Hood */
  compact?: boolean
  /** Override default heading color (default: light gray). */
  titleClassName?: string
  /** When set, replaces default cyan icon color entirely (avoids tw-merge losing to cyan). */
  iconClassName?: string
  /** Inline color wins over any Tailwind/global `h2` rules (fixes “refreshed, no change”). */
  titleStyle?: React.CSSProperties
  iconWrapperStyle?: React.CSSProperties
}) {
  return (
    <div className={cn("flex items-center gap-2", compact ? "mb-2" : "mb-3")}>
      <div
        className={
          iconClassName !== undefined
            ? cn(iconClassName)
            : cn("text-cyan-400", compact && "text-cyan-400/85")
        }
        style={iconWrapperStyle}
      >
        {icon}
      </div>
      <h2
        className={cn(
          "font-semibold",
          compact ? "text-sm" : "text-base",
          titleClassName ?? "text-[#f5f5f5]",
        )}
        style={titleStyle}
      >
        {title}
      </h2>
    </div>
  )
}

function UnderTheHoodPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative" aria-labelledby="weekly-under-the-hood-heading">
      <div className="relative overflow-hidden rounded-xl border border-slate-600/35 bg-[#1a1b21] shadow-[inset_0_1px_0_0_rgba(34,211,238,0.07)]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent"
          aria-hidden
        />
        <div className="border-b border-slate-600/40 bg-gradient-to-b from-slate-700/35 to-transparent px-4 py-3.5 md:px-5">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/[0.07] text-cyan-400 shadow-[0_0_24px_-8px_rgba(34,211,238,0.35)]"
              aria-hidden
            >
              <Cog className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 pt-0.5">
              <h2
                id="weekly-under-the-hood-heading"
                className="text-sm font-semibold tracking-tight text-slate-100"
              >
                Under the Hood
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Pipeline and operations behind the headline numbers—search tuning, data checks, internal notes, next
                steps, and linked case IDs.
              </p>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-cyan-500/25 bg-[#22232b] px-4 py-5 md:px-5">
          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </section>
  )
}

export function WeeklyReportContentRenderer({
  content,
  relatedCaseIds,
}: {
  content: WeeklyReportContent
  relatedCaseIds: string[]
}) {
  const searchQp = content.searchStrategy?.queryPerformance?.length ?? 0
  const searchNq = content.searchStrategy?.newQueriesAdded?.length ?? 0
  const hasSearchStrategyBody = searchQp > 0 || searchNq > 0
  const hasDataQuality = (content.dataQuality?.issues?.length ?? 0) > 0
  const hasObservations = (content.observations?.length ?? 0) > 0
  const hasRelated = relatedCaseIds.length > 0
  const nextSteps = content.nextSteps
  const hasNextSteps = Array.isArray(nextSteps) && nextSteps.length > 0
  const showUnderTheHood =
    hasSearchStrategyBody || hasDataQuality || hasObservations || hasRelated || hasNextSteps

  return (
    <div className="space-y-6">

      {/* Overview Stats */}
      <section>
        <WeeklyReportStats overview={content.overview} />
      </section>

      {/* Highlights — Index `/use-cases` table theme */}
      {content.highlights && content.highlights.length > 0 && (
        <WeeklyReportIndexPanel>
          <SectionHeader
            title="Use Case Highlights"
            titleClassName="text-[#43cc93]"
            iconClassName="text-[#43cc93]"
            titleStyle={{ color: INDEX_USE_CASE_GREEN }}
            iconWrapperStyle={{ color: INDEX_USE_CASE_GREEN }}
            icon={
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
          />
          <div className="grid gap-2 md:grid-cols-2">
            {content.highlights.map((h) => (
              <WeeklyReportHighlightCard key={h.id} highlight={h} />
            ))}
          </div>
        </WeeklyReportIndexPanel>
      )}

      {/* Trends — Index panel chrome + cyan glow (matches trend titles) */}
      {content.trends && content.trends.length > 0 && (
        <WeeklyReportIndexPanel glow="cyan">
          <SectionHeader
            title="Trends"
            titleClassName="text-cyan-400"
            iconClassName="text-cyan-400"
            titleStyle={{ color: TRENDS_CYAN }}
            iconWrapperStyle={{ color: TRENDS_CYAN }}
            icon={
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        </WeeklyReportIndexPanel>
      )}

      {/* Search / quality / observations / IDs — operational layer */}
      {showUnderTheHood && (
        <UnderTheHoodPanel>
          {hasSearchStrategyBody && content.searchStrategy ? (
            <div className="rounded-lg border border-slate-600/30 bg-[#2a2b34] p-3 md:p-4">
              <SectionHeader
                compact
                title="Search Strategy"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
              {content.searchStrategy.queryPerformance && content.searchStrategy.queryPerformance.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  <h3 className="text-xs font-medium text-slate-400">Query Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-left text-slate-500">
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
                  <h3 className="mb-1.5 text-xs font-medium text-slate-400">New Queries Added</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {content.searchStrategy.newQueriesAdded.map((q, i) => (
                      <span key={i} className="rounded bg-slate-800/90 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {hasDataQuality && content.dataQuality?.issues ? (
            <div className="rounded-lg border border-slate-600/30 bg-[#2a2b34] p-3 md:p-4">
              <SectionHeader
                compact
                title="Data Quality"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <div className="space-y-1.5">
                {content.dataQuality.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-600/25 bg-[#32333e] px-3 py-2">
                    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-amber-500/10 text-[10px] font-bold text-amber-400">
                      {issue.count}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-[#f5f5f5]">{issue.issue}</p>
                      <p className="text-[10px] text-slate-400">{issue.handling}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {hasObservations && content.observations ? (
            <div className="rounded-lg border border-slate-600/30 bg-[#2a2b34] p-3 md:p-4">
              <SectionHeader
                compact
                title="Observations"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                }
              />
              <ul className="space-y-1.5">
                {content.observations.map((insight, i) => (
                  <li key={i} className="flex gap-2 rounded-lg border border-slate-600/25 bg-[#32333e] px-3 py-2">
                    <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-cyan-400/90" />
                    <p className="text-xs text-slate-300">{insight}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {hasNextSteps && nextSteps ? (
            <div className="rounded-lg border border-slate-600/30 bg-[#2a2b34] p-3 md:p-4">
              <SectionHeader
                compact
                title="Next Steps"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
              <ul className="space-y-1.5">
                {nextSteps.map((step: NextStep, i: number) => (
                  <li key={i} className="rounded-lg border border-slate-600/25 bg-[#32333e] px-3 py-2">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="flex h-4 min-w-[1.25rem] items-center justify-center rounded bg-cyan-500/10 text-[10px] font-medium text-cyan-400">
                        {i + 1}
                      </span>
                      {step.priority ? (
                        <span className="rounded bg-slate-700/80 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-400">
                          {step.priority}
                        </span>
                      ) : null}
                      {step.file ? (
                        <span className="truncate font-mono text-[10px] text-slate-500" title={step.file}>
                          {step.file}
                        </span>
                      ) : null}
                    </div>
                    {step.issue ? <p className="text-xs font-medium text-slate-200">{step.issue}</p> : null}
                    {step.action ? <p className="mt-0.5 text-[11px] text-slate-400">{step.action}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {hasRelated ? (
            <div className="rounded-lg border border-slate-600/30 bg-[#2a2b34] p-3 md:p-4">
              <SectionHeader
                compact
                title="Related Use Cases"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                }
              />
              <div className="flex flex-wrap gap-1.5">
                {relatedCaseIds.slice(0, 20).map((id) => (
                  <OpenUseCaseDetailButton
                    key={id}
                    useCaseId={id}
                    className="rounded-lg border border-slate-600/35 bg-[#32333e] px-2 py-1 text-[10px] text-cyan-400/95 transition-colors hover:border-cyan-500/40"
                  >
                    {id.slice(0, 8)}…
                  </OpenUseCaseDetailButton>
                ))}
                {relatedCaseIds.length > 20 && (
                  <span className="px-2 py-1 text-[10px] text-slate-500">+{relatedCaseIds.length - 20} more</span>
                )}
              </div>
            </div>
          ) : null}
        </UnderTheHoodPanel>
      )}

    </div>
  )
}
