"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Activity,
  ArrowLeft,
  AlertTriangle,
  ClipboardList,
  Database,
  ListChecks,
  Search,
  Wrench,
} from "lucide-react"
import type { WeeklyAdminRow } from "@/lib/types-weekly-admin"
import type { OpsIssue, WeekDiff, WeekTrendPoint } from "@/lib/weekly-ops-issues"
import { HealthBand, WeeklyOpsTrend, WeekNav } from "./weekly-ops-trend"
import { WeeklyOpsIssuesView } from "./weekly-ops-issues-view"
import { IssueMarkControls, STATUS_COLOR, STATUS_LABEL } from "./issue-mark-controls"
import { buildOccurrenceIndex, occurrenceKey } from "@/lib/weekly-ops-issues"
import { WeeklyOpsSearch } from "./weekly-ops-search"
import { Group, HowCalculated, Step, Steps, Term, WriterNote } from "./how-calculated"

const SURFACE = "#1c1c1c"
const BORDER = "#2f2f2f"
const MUTED = "#8a8a8a"
const GREEN = "#43cc93"
const AMBER = "#f59e0b"
const RED = "#ef4444"
const BLUE = "#60a5fa"

const HEALTH_COLOR: Record<string, string> = { green: GREEN, yellow: AMBER, red: RED }
const SEVERITY_COLOR: Record<string, string> = { info: BLUE, warning: AMBER, critical: RED }
const PRIORITY_COLOR: Record<string, string> = { high: RED, medium: AMBER, low: MUTED }
const HIT_RATE_COLOR: Record<string, string> = { High: GREEN, Medium: AMBER, Low: MUTED }
const CARRY_COLOR: Record<string, string> = { resolved: GREEN, carried: AMBER, new: BLUE }

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color, background: `${color}1a`, border: `1px solid ${color}33` }}
    >
      {label}
    </span>
  )
}

function Panel({
  title,
  icon,
  count,
  children,
}: {
  title: string
  icon: React.ReactNode
  count?: number
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border p-4" style={{ borderColor: BORDER, background: SURFACE }}>
      <div className="mb-3 flex items-center gap-2">
        <span style={{ color: MUTED }}>{icon}</span>
        <h2 className="text-sm font-semibold tracking-tight text-[#f5f5f5]">{title}</h2>
        {count !== undefined && (
          <span className="ml-auto text-xs tabular-nums" style={{ color: MUTED }}>
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

/** A null column means the weekly writer never wrote the field — not the same as an empty one. */
function NotWritten() {
  return (
    <p className="rounded border border-dashed px-3 py-2 text-xs" style={{ borderColor: BORDER, color: MUTED }}>
      Not written by the weekly writer.
    </p>
  )
}

function Empty({ what }: { what: string }) {
  return (
    <p className="text-xs" style={{ color: MUTED }}>
      No {what} this week.
    </p>
  )
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: BORDER, background: SURFACE }}>
      <div className="text-lg font-semibold tabular-nums" style={{ color: color ?? "#f5f5f5" }}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>
        {label}
      </div>
    </div>
  )
}

/** The verdict controls for a card, once it has been traced back to its issue. */
function CardVerdict({
  issue,
  newestWeek,
}: {
  issue: ReturnType<typeof buildOccurrenceIndex> extends Map<string, infer I> ? I | undefined : never
  newestWeek: { year: number; isoWeek: number }
}) {
  if (!issue) return null
  return (
    <div className="mt-2.5 border-t pt-2.5" style={{ borderColor: BORDER }}>
      {issue.adminStatus && (
        <div className="mb-2 flex items-center gap-2">
          <Chip label={STATUS_LABEL[issue.adminStatus]} color={STATUS_COLOR[issue.adminStatus]} />
          {issue.adminNote && (
            <span className="text-[11px] italic" style={{ color: MUTED }}>
              {issue.adminNote}
            </span>
          )}
        </div>
      )}
      <IssueMarkControls issue={issue} newestWeek={newestWeek} withNote={false} />
    </div>
  )
}

function formatRange(startIso: string, endIso: string): string {
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    })
  return `${fmt(startIso)} – ${fmt(endIso)}`
}

/** Section titles for the overview, which stacks its sections rather than tabbing between them. */
function SectionHeading({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-2.5 flex items-baseline gap-2">
      <h2 className="text-sm font-semibold tracking-tight text-[#f5f5f5]">{title}</h2>
      {count !== undefined && (
        <span className="text-xs tabular-nums" style={{ color: MUTED }}>
          {count}
        </span>
      )}
    </div>
  )
}

function delta(n: number): { text: string; color: string } {
  if (n > 0) return { text: `+${n}`, color: GREEN }
  if (n < 0) return { text: String(n), color: RED }
  return { text: "0", color: MUTED }
}

export function WeeklyOpsPanel({
  rows,
  issues,
  trend,
  diff,
  initialWeek,
}: {
  rows: WeeklyAdminRow[]
  issues: OpsIssue[]
  trend: WeekTrendPoint[]
  diff: WeekDiff | null
  /** `?week=2026-W35` from the URL, so a week is addressable and shareable. */
  initialWeek: string | null
}) {
  // The page has two modes and this is the whole of the state that picks one:
  // no week selected is the overview, a selected week is that week's record.
  const [selected, setSelected] = useState<string | null>(initialWeek)

  const weekOf = (r: WeeklyAdminRow) => `${r.year}-W${r.isoWeek}`
  const row = selected ? rows.find((r) => weekOf(r) === selected) ?? null : null
  const openCount = issues.filter((i) => i.actionable).length
  // Cards here are rendered from the raw arrays, so each one has to be traced
  // back to its issue before the operator can act on it from this view.
  const occurrences = useMemo(() => buildOccurrenceIndex(issues), [issues])
  const newestWeek = rows[0] ? { year: rows[0].year, isoWeek: rows[0].isoWeek } : { year: 0, isoWeek: 0 }

  // The mode lives in the URL so it survives a refresh, can be linked to, and
  // answers the browser's back button. The data is already here, so this
  // replaces the history entry rather than refetching the page.
  const go = useCallback((week: string | null) => {
    setSelected(week)
    const url = week ? `?week=${week}` : window.location.pathname
    window.history.pushState({ week }, "", url)
  }, [])

  useEffect(() => {
    const onPop = () => {
      const week = new URLSearchParams(window.location.search).get("week")
      setSelected(week)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border p-6 text-sm" style={{ borderColor: BORDER, background: SURFACE, color: MUTED }}>
        No weekly operations records yet. The weekly writer upserts one row per ISO week.
      </p>
    )
  }

  const health = row?.systemHealth
  const metrics = row?.agentMetrics
  const statusColor = HEALTH_COLOR[health?.status ?? ""] ?? MUTED

  return (
    <div className="space-y-4">
      {/* The title says which mode you are in; nothing else has to. */}
      {row ? (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={() => go(null)}
            className="inline-flex items-center gap-1.5 text-xs transition-colors hover:text-[#f5f5f5]"
            style={{ color: MUTED }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All weeks
          </button>
          <h1 className="text-base font-semibold text-[#f5f5f5]">{weekOf(row)}</h1>
          <span className="text-xs" style={{ color: MUTED }}>
            {formatRange(row.weekStart, row.weekEnd)}
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-base font-semibold text-[#f5f5f5]">All weeks</h1>
          <span className="text-xs" style={{ color: MUTED }}>
            {rows.length} on record · {openCount} needing attention
          </span>
        </div>
      )}

      <HealthBand trend={trend} selected={selected} onSelect={(y, w) => go(`${y}-W${w}`)} />

      {!row && (
        <div className="space-y-6">
          <WeeklyOpsTrend trend={trend} />

          <section>
            <SectionHeading title="Needs attention" count={openCount} />
            <WeeklyOpsIssuesView issues={issues} diff={diff} newestWeek={newestWeek} />
          </section>

          <section>
            <SectionHeading title="Search tooling" />
            <WeeklyOpsSearch rows={rows} />
          </section>
        </div>
      )}

      {row && (
      <div className="space-y-4">
      <WeekNav trend={trend} selected={selected} onSelect={(y, w) => go(`${y}-W${w}`)} />

      {/* Status banner */}
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border px-4 py-3"
        style={{ borderColor: `${statusColor}40`, background: `${statusColor}0f` }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: statusColor }} />
        <span className="text-sm font-semibold" style={{ color: statusColor }}>
          {health ? health.label : "System health not written"}
        </span>
        <span className="text-xs" style={{ color: MUTED }}>
          {formatRange(row.weekStart, row.weekEnd)}
          {row.slug ? ` · ${row.slug}` : ""}
          {row.blogPostId ? "" : " · no public post"}
        </span>
        <span className="ml-auto text-[11px]" style={{ color: MUTED }}>
          updated {new Date(row.updatedAt).toLocaleString("en-GB", { timeZone: "Europe/Prague" })}
        </span>
      </div>

      {/* Metrics strip */}
      {metrics ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Agent runs" value={String(metrics.runsThisWeek)} color={metrics.runsThisWeek === 0 ? AMBER : undefined} />
          {/* The engine's score. `agentMetrics.dataQualityScore` is the
              writer's own derivation of the same name and is not shown. */}
          <Metric
            label="Data quality"
            value={row.dataQuality?.score === undefined ? "—" : String(row.dataQuality.score)}
            color={
              row.dataQuality?.score === undefined
                ? MUTED
                : row.dataQuality.score >= 95
                  ? GREEN
                  : AMBER
            }
          />
          <Metric
            label="Failed gate"
            value={String(metrics.recordsFailedQualityGate)}
            color={metrics.recordsFailedQualityGate > 0 ? AMBER : undefined}
          />
          <Metric label="Errors caught" value={String(metrics.totalErrorsIntercepted)} />
        </div>
      ) : null}

      {metrics ? (
        <HowCalculated>
          <Group title="Where these come from">
            <Term term="Agent runs, errors">
              <code>agent_metrics</code> on this week&rsquo;s row, written by Step 3e of the
              <code> weekly-ops-report</code> skill from <code>tmp/pipeline_metrics.jsonl</code>{" "}
              and <code>ERRORS.md</code>.
            </Term>
            <Term term="Data quality">
              Not from that field. It is the engine score shown in the Data quality panel below.
              <code> agent_metrics</code> carries a <code>dataQualityScore</code> of its own,
              derived by the writer, and it is deliberately not displayed — two numbers under one
              label is what this page was changed to stop doing.
            </Term>
          </Group>
          <Group title="Reading a zero">
            <Term term="Agent runs 0">
              No pipeline run was recorded for the week at all. That is a real signal rather than a
              gap: it is how the cron being offline first showed up.
            </Term>
          </Group>
        </HowCalculated>
      ) : (
        <Panel title="Agent metrics" icon={<Activity className="h-4 w-4" />}>
          <NotWritten />
        </Panel>
      )}

      {/* Warnings */}
      <Panel
        title="Flagged conditions"
        icon={<AlertTriangle className="h-4 w-4" />}
        count={health?.warnings?.length}
      >
        {!health ? (
          <NotWritten />
        ) : health.warnings.length === 0 ? (
          <Empty what="warnings" />
        ) : (
          <ul className="space-y-2.5">
            {health.warnings.map((w, i) => {
              const c = SEVERITY_COLOR[w.severity] ?? MUTED
              return (
                <li key={i} className="rounded-lg border p-3" style={{ borderColor: BORDER }}>
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Chip label={w.severity} color={c} />
                    <code className="text-[11px] break-all" style={{ color: MUTED }}>
                      {w.location}
                    </code>
                  </div>
                  <p className="text-xs leading-relaxed text-[#d4d4d4]">{w.issue}</p>
                  <p className="mt-1.5 text-xs leading-relaxed" style={{ color: MUTED }}>
                    → {w.recommendation}
                  </p>
                  <CardVerdict
                    issue={occurrences.get(occurrenceKey(row.year, row.isoWeek, "warning", w.issue))}
                    newestWeek={newestWeek}
                  />
                </li>
              )
            })}
          </ul>
        )}

        <HowCalculated>
          <Group title="Where it comes from">
            <Term term="Field">
              <code>system_health.warnings[]</code> on this week&rsquo;s row, written by Step 3a of
              the <code>weekly-ops-report</code> skill.
            </Term>
            <WriterNote />
          </Group>
          <Group title="How it is graded">
            <Term term="critical">Blocks core functionality, risks data loss, or is a security issue.</Term>
            <Term term="warning">Significant impact, affects common workflows, or recurs.</Term>
            <Term term="info">Moderate impact with a workaround, or a minor or edge case.</Term>
            <Term term="Before 2026-09-19">
              No rubric existed and grading was freehand. Across the nineteen weeks on record 29 of
              38 entries were graded <code>warning</code>, which was a default rather than a
              judgement — treat older gradings as weak evidence.
            </Term>
          </Group>
          <Group title="Why the location matters">
            <Term term="Grouping key">
              The <code>location</code> is what links this entry to the same problem in other
              weeks. A file path written inconsistently splits one long-running problem into
              several unrelated ones.
            </Term>
          </Group>
        </HowCalculated>
      </Panel>

      <div className="grid gap-4">
        {/* Next steps */}
        <Panel title="Next steps" icon={<ListChecks className="h-4 w-4" />} count={row.nextSteps?.length}>
          {!row.nextSteps ? (
            <NotWritten />
          ) : row.nextSteps.length === 0 ? (
            <Empty what="next steps" />
          ) : (
            <ul className="space-y-2.5">
              {row.nextSteps.map((s, i) => (
                <li key={i} className="rounded-lg border p-3" style={{ borderColor: BORDER }}>
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Chip label={s.priority} color={PRIORITY_COLOR[s.priority] ?? MUTED} />
                    <code className="text-[11px] break-all" style={{ color: MUTED }}>
                      {s.file}
                    </code>
                  </div>
                  <p className="text-xs leading-relaxed text-[#d4d4d4]">{s.issue}</p>
                  <p className="mt-1.5 text-xs leading-relaxed" style={{ color: MUTED }}>
                    → {s.action}
                  </p>
                  <CardVerdict
                    issue={occurrences.get(occurrenceKey(row.year, row.isoWeek, "next-step", s.issue))}
                    newestWeek={newestWeek}
                  />
                </li>
              ))}
            </ul>
          )}

          <HowCalculated>
            <Group title="Where it comes from">
              <Term term="Field">
                <code>next_steps[]</code> on this week&rsquo;s row, written by Step 3f of the
                <code> weekly-ops-report</code> skill.
              </Term>
              <Term term="Drawn from">
                <code>ERRORS.md</code>, the previous week&rsquo;s next steps read back out of this
                same table, and quality-gate violations.
              </Term>
              <WriterNote />
            </Group>
            <Group title="Priority">
              <Term term="Scale">
                The same rubric as the flagged conditions above:{" "}
                <code>critical</code>/<code>warning</code> map to <code>high</code>,{" "}
                <code>info</code> to <code>medium</code> or <code>low</code>. An item graded
                critical in one place and low in the other is a contradiction.
              </Term>
              <Term term="Not about age">
                A condition keeps its grade for as long as it holds. Something does not become less
                serious because it has been raised before.
              </Term>
            </Group>
            <Group title="What the writer skips">
              <Term term="Already handled">
                Before drafting, the writer asks{" "}
                <code>/api/admin/weekly-ops/match</code> which of its drafts you have already
                marked, and drops anything marked done or won&rsquo;t fix. That call only works
                once the endpoint is deployed; until then every draft is raised as new.
              </Term>
            </Group>
          </HowCalculated>
        </Panel>

        {/* Search strategy */}
        <Panel
          title="Search strategy"
          icon={<Search className="h-4 w-4" />}
          count={row.searchStrategy?.queryPerformance.length}
        >
          {!row.searchStrategy ? (
            <NotWritten />
          ) : (
            <div className="space-y-3">
              {row.searchStrategy.queryPerformance.length === 0 ? (
                <Empty what="query performance" />
              ) : (
                <ul className="space-y-2">
                  {row.searchStrategy.queryPerformance.map((q, i) => (
                    <li key={i} className="rounded-lg border p-2.5" style={{ borderColor: BORDER }}>
                      <div className="flex items-start gap-2">
                        <Chip label={q.hitRate} color={HIT_RATE_COLOR[q.hitRate] ?? MUTED} />
                        <span className="text-xs leading-relaxed text-[#d4d4d4]">{q.query}</span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: MUTED }}>
                        {q.notes}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {row.searchStrategy.newQueriesAdded.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>
                    New queries added
                  </p>
                  <ul className="space-y-1">
                    {row.searchStrategy.newQueriesAdded.map((q, i) => (
                      <li key={i} className="text-[11px] leading-relaxed" style={{ color: MUTED }}>
                        + {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <HowCalculated>
                <Group title="Where it comes from">
                  <Term term="Field">
                    <code>search_strategy</code> on this week&rsquo;s row, written by Step 3c of the
                    <code> weekly-ops-report</code> skill.
                  </Term>
                  <WriterNote />
                </Group>
                <Group title="What the hit rate means">
                  <Term term="High / Medium / Low">
                    The writer&rsquo;s own reading of what a query returned that week, required to
                    be traceable to a candidate or an ingested record rather than an impression.
                    It is not measured and no threshold defines the three levels.
                  </Term>
                  <Term term="Not the same as usage">
                    This is about which queries were worth running. How often each tool answered at
                    all is in the Search tooling view.
                  </Term>
                </Group>
              </HowCalculated>
            </div>
          )}
        </Panel>

        {/* Data quality — scored by the shared rule engine since 2026-09-19.
            Weeks written before that carry a hand-derived score and an
            `issues` list instead, so both shapes render. */}
        <Panel
          title="Data quality"
          icon={<Database className="h-4 w-4" />}
          count={row.dataQuality?.rules?.length ?? row.dataQuality?.issues?.length}
        >
          {!row.dataQuality ? (
            <NotWritten />
          ) : (
            <div className="space-y-3">
              {row.dataQuality.score !== undefined && (
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-2xl font-semibold tabular-nums"
                    style={{ color: row.dataQuality.score >= 95 ? GREEN : AMBER }}
                  >
                    {row.dataQuality.score}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider" style={{ color: MUTED }}>
                    {row.dataQuality.source === "quality-engine" ? "engine score" : "score"}
                  </span>
                  {row.dataQuality.totals && (
                    <span className="ml-auto text-[11px]" style={{ color: MUTED }}>
                      {row.dataQuality.totals.useCases} use cases · {row.dataQuality.totals.companies} orgs
                    </span>
                  )}
                </div>
              )}

              {row.dataQuality.rules ? (
                row.dataQuality.rules.length === 0 ? (
                  <Empty what="rule failures" />
                ) : (
                  <ul className="space-y-1.5">
                    {row.dataQuality.rules.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-baseline justify-between gap-3 border-b pb-1.5 last:border-0"
                        style={{ borderColor: BORDER }}
                      >
                        <span className="flex min-w-0 items-baseline gap-2">
                          <Chip label={r.severity} color={SEVERITY_COLOR[r.severity] ?? MUTED} />
                          <span className="text-xs text-[#d4d4d4]">{r.name}</span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold tabular-nums" style={{ color: AMBER }}>
                          {r.failed}
                          <span style={{ color: MUTED }}>/{r.total}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )
              ) : !row.dataQuality.issues || row.dataQuality.issues.length === 0 ? (
                <Empty what="issues" />
              ) : (
                <ul className="space-y-1.5">
                  {row.dataQuality.issues.map((d, i) => (
                    <li
                      key={i}
                      className="flex items-baseline justify-between gap-3 border-b pb-1.5 last:border-0"
                      style={{ borderColor: BORDER }}
                    >
                      <span className="text-xs text-[#d4d4d4]">{d.issue}</span>
                      <span className="flex shrink-0 items-baseline gap-2">
                        <span
                          className="text-xs font-semibold tabular-nums"
                          style={{ color: d.count > 0 ? AMBER : MUTED }}
                        >
                          {d.count}
                        </span>
                        <span className="text-[10px]" style={{ color: MUTED }}>
                          {d.handling}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <HowCalculated>
                <Group title="Where it comes from">
                  <Steps>
                    <Step n="01" title="One engine scores every week">
                      The rules behind the <code>/quality</code> dashboard, run for this week&rsquo;s
                      records through <code>/api/admin/weekly-ops/quality</code>.
                    </Step>
                    <Step n="02" title="The writer only stores the answer">
                      Step 3d of the skill calls that endpoint and saves the response unchanged. It
                      is forbidden from deriving a score of its own.
                    </Step>
                  </Steps>
                </Group>
                <Group title="How the score is built">
                  <Term term="Rules">
                    Fourteen checks — required fields, real coordinates, GICS industry validity,
                    company references, URL quality, summary length, HTML and navigation
                    contamination, duplicates.
                  </Term>
                  <Term term="Weighting">
                    Each rule counts by severity, and use cases carry 90% of the score against
                    companies&rsquo; 10%.
                  </Term>
                  <Term term="Scope">
                    Records created inside this week, at every status. Companies are always read in
                    full regardless, because the reference check has to resolve companies older
                    than the week.
                  </Term>
                </Group>
                <Group title="Weeks written before 2026-09-19">
                  <Term term="A different number">
                    Those weeks show an <code>issues</code> list instead of rules. Their score came
                    from the writer counting one thing — the share of published use cases with at
                    least 500 characters — and calling it data quality. It ignored everything
                    archived and every other rule. Re-scored against the engine, several of those
                    weeks were not the 100 they reported.
                  </Term>
                </Group>
              </HowCalculated>
            </div>
          )}
        </Panel>

        {/* Search tool usage */}
        <Panel title="Search tool usage" icon={<Wrench className="h-4 w-4" />}>
          {!row.searchToolUsage ? (
            <NotWritten />
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                {(["runCount", "totalSearches", "totalCandidates"] as const).map((k) => (
                  <div key={k} className="rounded-lg border px-2 py-2" style={{ borderColor: BORDER }}>
                    <div className="text-sm font-semibold tabular-nums text-[#f5f5f5]">
                      {row.searchToolUsage!["thisWeek"][k]}
                    </div>
                    <div className="text-[10px]" style={{ color: MUTED }}>
                      vs {row.searchToolUsage!["lastWeek"][k]} last wk
                    </div>
                  </div>
                ))}
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ color: MUTED }}>
                    <th className="pb-1 text-left text-[10px] font-medium uppercase tracking-wider">Tool</th>
                    <th className="pb-1 text-right text-[10px] font-medium uppercase tracking-wider">Searches</th>
                    <th className="pb-1 text-right text-[10px] font-medium uppercase tracking-wider">Cands</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(row.searchToolUsage.thisWeek.tools).map(([name, c]) => (
                    <tr key={name} className="border-t" style={{ borderColor: BORDER }}>
                      <td className="py-1 text-[#d4d4d4]">{name}</td>
                      <td className="py-1 text-right tabular-nums" style={{ color: c.searches ? "#f5f5f5" : MUTED }}>
                        {c.searches}
                      </td>
                      <td className="py-1 text-right tabular-nums" style={{ color: c.candidates ? "#f5f5f5" : MUTED }}>
                        {c.candidates}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] leading-relaxed" style={{ color: MUTED }}>
                <span style={{ color: delta(row.searchToolUsage.change.searches).color }}>
                  {delta(row.searchToolUsage.change.searches).text} searches
                </span>
                {" · "}
                <span style={{ color: delta(row.searchToolUsage.change.candidates).color }}>
                  {delta(row.searchToolUsage.change.candidates).text} candidates
                </span>
                {row.searchToolUsage.change.notes ? ` — ${row.searchToolUsage.change.notes}` : ""}
              </p>

              <HowCalculated>
                <Group title="Where it comes from">
                  <Term term="Field">
                    <code>search_tool_usage</code> on this week&rsquo;s row, written by Step 3b of
                    the <code>weekly-ops-report</code> skill, which sums the{" "}
                    <code>tmp/push_raw_*.json</code> files dated inside the week.
                  </Term>
                  <Term term="A zero">
                    Means the writer found no runs. It cannot tell a tool that was never called
                    from one that was called and returned nothing — both land as zero in{" "}
                    <code>push_raw</code>.
                  </Term>
                </Group>
                <Group title="This panel only sees two weeks">
                  <Term term="Use the Search tooling view">
                    &ldquo;vs last week&rdquo; cannot show a tool that has quietly stopped
                    answering: after the first week it is simply zero against zero. The Search
                    tooling view counts consecutive silent weeks across the whole record, which is
                    where <code>xcrawl</code> and <code>firecrawl</code> turn out to have been
                    silent for ten weeks.
                  </Term>
                </Group>
              </HowCalculated>
            </div>
          )}
        </Panel>

        {/* Carry over */}
        <Panel title="Carry-over" icon={<ClipboardList className="h-4 w-4" />} count={row.carryOver?.length}>
          {!row.carryOver ? (
            <NotWritten />
          ) : row.carryOver.length === 0 ? (
            <Empty what="carry-over items" />
          ) : (
            <ul className="space-y-2">
              {row.carryOver.map((c, i) => (
                <li key={i} className="rounded-lg border p-2.5" style={{ borderColor: BORDER }}>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Chip label={c.status} color={CARRY_COLOR[c.status] ?? MUTED} />
                    <span className="text-[11px]" style={{ color: MUTED }}>
                      from {c.fromWeek}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#d4d4d4]">{c.step.issue}</p>
                  <CardVerdict
                    issue={occurrences.get(occurrenceKey(row.year, row.isoWeek, "next-step", c.step.issue))}
                    newestWeek={newestWeek}
                  />
                </li>
              ))}
            </ul>
          )}

          <HowCalculated>
            <Group title="Where it comes from">
              <Term term="Field">
                <code>carry_over[]</code> on this week&rsquo;s row, written by Step 3g of the
                <code> weekly-ops-report</code> skill. Each entry is an earlier week&rsquo;s next
                step plus a verdict.
              </Term>
              <Term term="Why it exists">
                An outstanding next step does not stay in <code>next_steps</code> — it moves here
                the following week. Both lists are folded into the same issue history, which is how
                an item keeps one identity across weeks instead of looking closed the moment it
                stops being a next step.
              </Term>
            </Group>
            <Group title="The verdicts">
              <Term term="resolved">
                Only when you marked it done, or when that run had direct evidence of a fix. Once
                any week records it, it stays resolved — a later run cannot put it back to carried
                because it could not find the evidence again.
              </Term>
              <Term term="carried">Still outstanding.</Term>
              <Term term="Marked won&rsquo;t fix">Dropped entirely rather than carried.</Term>
              <Term term="What it is not">
                A claim about the writer&rsquo;s attention. Something is never resolved because it
                stopped being mentioned, and never un-resolved because it was mentioned again.
              </Term>
            </Group>
          </HowCalculated>
        </Panel>
      </div>
      </div>
      )}
    </div>
  )
}
