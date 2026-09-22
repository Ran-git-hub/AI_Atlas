"use client"

import type { WeeklyAdminRow } from "@/lib/types-weekly-admin"
import { Group, HowCalculated, Step, Steps, Term } from "./how-calculated"

const SURFACE = "#1c1c1c"
const BORDER = "#2f2f2f"
const MUTED = "#8a8a8a"
const GREEN = "#43cc93"
const AMBER = "#f59e0b"
const RED = "#ef4444"

interface ToolRow {
  tool: string
  perWeek: (number | null)[]
  total: number
  /** Weeks since this tool last returned a search, null if it never has. */
  silentFor: number | null
}

/**
 * Search tooling across every week on record.
 *
 * The per-week panel could only ever say "this week versus last week", which
 * hides the thing worth knowing: which tools have quietly stopped returning
 * anything. Tavily was exhausted in April and the weekly view showed it as one
 * more zero.
 */
export function WeeklyOpsSearch({ rows }: { rows: WeeklyAdminRow[] }) {
  // Oldest first, so the columns read left to right like the trend strip.
  const weeks = [...rows].sort((a, b) => a.year - b.year || a.isoWeek - b.isoWeek)

  const toolNames = new Set<string>()
  for (const r of weeks) {
    for (const name of Object.keys(r.searchToolUsage?.thisWeek?.tools ?? {})) toolNames.add(name)
  }

  const tools: ToolRow[] = [...toolNames].map((tool) => {
    const perWeek = weeks.map((r) => {
      const usage = r.searchToolUsage?.thisWeek?.tools
      if (!usage) return null
      return usage[tool]?.searches ?? 0
    })
    const total = perWeek.reduce<number>((sum, v) => sum + (v ?? 0), 0)

    // Consecutive weeks with no searches, counting back from the newest.
    // A tool that has never returned anything is a different state from one
    // that answered this week, and null was standing for both.
    let silentFor = 0
    if (total > 0) {
      for (let i = perWeek.length - 1; i >= 0 && (perWeek[i] ?? 0) === 0; i--) silentFor++
    }
    return { tool, perWeek, total, silentFor: total === 0 ? null : silentFor }
  })
  tools.sort((a, b) => b.total - a.total)

  const weekTotals = weeks.map((r) => r.searchToolUsage?.thisWeek?.totalSearches ?? null)
  const maxWeek = Math.max(...weekTotals.map((v) => v ?? 0), 1)
  const grandTotal = tools.reduce((sum, t) => sum + t.total, 0)

  if (weeks.length === 0 || tools.length === 0) {
    return (
      <p
        className="rounded-lg border p-4 text-sm"
        style={{ borderColor: BORDER, background: SURFACE, color: MUTED }}
      >
        No search tool usage recorded in any week on record.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Searches per week */}
      <section className="rounded-lg border p-4" style={{ borderColor: BORDER, background: SURFACE }}>
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-lg font-semibold tabular-nums text-[#f5f5f5]">{grandTotal}</span>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>
            searches across {weeks.length} weeks
          </span>
        </div>
        <div className="flex h-12 items-end gap-[2px]">
          {weeks.map((r, i) => {
            const v = weekTotals[i]
            const h = v === null ? 2 : Math.max((v / maxWeek) * 48, v > 0 ? 3 : 1)
            return (
              <div
                key={`${r.year}-${r.isoWeek}`}
                className="min-w-[3px] flex-1 rounded-sm"
                style={{ height: h, background: v === null ? BORDER : v > 0 ? GREEN : `${MUTED}55` }}
                title={`${r.year}-W${r.isoWeek}: ${v === null ? "not written" : `${v} searches`}`}
              />
            )
          })}
        </div>
      </section>

      {/* Per tool */}
      <section className="rounded-lg border p-4" style={{ borderColor: BORDER, background: SURFACE }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ color: MUTED }}>
              <th className="pb-2 text-left text-[10px] font-medium uppercase tracking-wider">Tool</th>
              <th className="pb-2 text-left text-[10px] font-medium uppercase tracking-wider">
                By week — oldest to newest
              </th>
              <th className="pb-2 text-right text-[10px] font-medium uppercase tracking-wider">Total</th>
              <th className="pb-2 text-right text-[10px] font-medium uppercase tracking-wider">Silent</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((t) => {
              const max = Math.max(...t.perWeek.map((v) => v ?? 0), 1)
              const dead = t.silentFor !== null && t.silentFor >= 4
              return (
                <tr key={t.tool} className="border-t" style={{ borderColor: BORDER }}>
                  <td className="py-2 pr-3 align-middle text-[#d4d4d4]">{t.tool}</td>
                  <td className="py-2 pr-3 align-middle">
                    <div className="flex h-5 items-end gap-[2px]">
                      {t.perWeek.map((v, i) => (
                        <div
                          key={i}
                          className="min-w-[2px] flex-1 rounded-sm"
                          style={{
                            height: v === null ? 2 : Math.max((v / max) * 20, v > 0 ? 2 : 1),
                            background: v === null ? BORDER : v > 0 ? GREEN : `${MUTED}44`,
                          }}
                          title={`${weeks[i].year}-W${weeks[i].isoWeek}: ${v === null ? "not written" : `${v} searches`}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td
                    className="py-2 text-right align-middle tabular-nums"
                    style={{ color: t.total > 0 ? "#f5f5f5" : MUTED }}
                  >
                    {t.total}
                  </td>
                  <td className="py-2 text-right align-middle tabular-nums">
                    {t.silentFor === null ? (
                      <span style={{ color: MUTED }}>never used</span>
                    ) : t.silentFor === 0 ? (
                      <span style={{ color: GREEN }}>active</span>
                    ) : (
                      <span style={{ color: dead ? RED : AMBER }}>{t.silentFor}w</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <HowThisIsCalculated weekCount={weeks.length} toolCount={tools.length} />
    </div>
  )
}

/**
 * Where the numbers come from and how each one is derived. On the page rather
 * than in a document, because the question this view answers most often is
 * "is that zero real?" and the answer depends entirely on the chain below.
 */
function HowThisIsCalculated({ weekCount, toolCount }: { weekCount: number; toolCount: number }) {
  return (
    <HowCalculated>
        <Group title="Where the data comes from">
          <Steps>
            <Step n="01" title="The search step writes a file per run">
              <code>ai-atlas-step1-searcher</code> queries each tool and writes{" "}
              <code>tmp/push_raw_HHMMSS_DDMMYYYY.json</code> with that run&rsquo;s per-tool counts
              of searches issued and candidates returned.
            </Step>
            <Step n="02" title="The weekly ops writer aggregates the week">
              Step 3b of <code>weekly-ops-report</code> scans the{" "}
              <code>push_raw_*.json</code> files dated inside the week and sums them per tool.
            </Step>
            <Step n="03" title="One row per week is stored">
              The result is written to the <code>search_tool_usage</code> column of{" "}
              <code>AI_Atlas_Weekly_Reports_Admin</code>, alongside that week&rsquo;s other
              operations fields.
            </Step>
            <Step n="04" title="This view reads every week at once">
              {weekCount} weeks are read from that column and laid side by side. Nothing here is
              recomputed from the pipeline — it can only show what the writer recorded.
            </Step>
          </Steps>
        </Group>

        <Group title="How each number is derived">
            <Term term="Tool list">
              Every tool name that appears in any week&rsquo;s <code>thisWeek.tools</code>, so a
              tool retired long ago still has a row. Currently {toolCount}.
            </Term>
            <Term term="By week">
              <code>thisWeek.tools[tool].searches</code> for each week, oldest on the left. Each
              bar is scaled against that tool&rsquo;s own busiest week, so rows are not comparable
              with each other by height.
            </Term>
            <Term term="Searches per week">
              <code>thisWeek.totalSearches</code>, the writer&rsquo;s own total for the week rather
              than a sum of the rows above it. The two disagreeing would mean the writer&rsquo;s
              aggregation is wrong.
            </Term>
            <Term term="Total">
              The tool&rsquo;s searches summed over every week shown.
            </Term>
            <Term term="Silent">
              Consecutive weeks with zero searches, counting back from the newest week on record.
              Four or more is red. <span className="text-[#d4d4d4]">Active</span> means the newest
              week used it; <span className="text-[#d4d4d4]">never used</span> means no week ever
              recorded a search for it.
            </Term>
        </Group>

        <Group title="Reading the zeros">
            <Term term="A flat grey bar">
              The week has no <code>search_tool_usage</code> at all — the writer never recorded it.
              This is not the same as a recorded zero, and the two are drawn differently on purpose.
            </Term>
            <Term term="A recorded zero">
              The writer looked and found no runs. It cannot distinguish a tool that was never
              called from one that was called and returned nothing: both land as zero in{" "}
              <code>push_raw</code>.
            </Term>
            <Term term="lastWeek is ignored">
              Each row also stores a <code>lastWeek</code> block. This view reads only{" "}
              <code>thisWeek</code> from every row, because the previous week is already present as
              its own row and counting both would double every number.
            </Term>
        </Group>
    </HowCalculated>
  )
}
