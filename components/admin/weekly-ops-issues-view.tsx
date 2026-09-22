"use client"

import { useState } from "react"
import { AlertTriangle, ChevronDown, ChevronRight, ListChecks, RotateCcw } from "lucide-react"
import type { OpsIssue, WeekDiff } from "@/lib/weekly-ops-issues"
import { IssueMarkControls, STATUS_COLOR, STATUS_LABEL } from "./issue-mark-controls"
import { Group, HowCalculated, Step, Steps, Term } from "./how-calculated"

const SURFACE = "#1c1c1c"
const BORDER = "#2f2f2f"
const MUTED = "#8a8a8a"
const GREEN = "#43cc93"
const AMBER = "#f59e0b"
const RED = "#ef4444"
const BLUE = "#60a5fa"

const GRADE_COLOR: Record<string, string> = {
  critical: RED,
  high: RED,
  warning: AMBER,
  medium: AMBER,
  info: BLUE,
  low: MUTED,
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
      style={{ color, background: `${color}1a`, border: `1px solid ${color}33` }}
    >
      {label}
    </span>
  )
}

function IssueCard({
  issue,
  newestWeek,
}: {
  issue: OpsIssue
  newestWeek: { year: number; isoWeek: number }
}) {
  const [open, setOpen] = useState(false)

  const grade = GRADE_COLOR[issue.latest.grade] ?? MUTED
  const accent = issue.reopened ? RED : issue.actionable ? (issue.streak > 1 ? RED : grade) : GREEN

  return (
    <li className="rounded-lg border" style={{ borderColor: issue.reopened ? `${RED}55` : BORDER, background: SURFACE }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2.5 p-3 text-left"
      >
        <span className="mt-0.5 shrink-0" style={{ color: MUTED }}>
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-1.5 flex flex-wrap items-center gap-2">
            {issue.source === "warning" ? (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: grade }} />
            ) : (
              <ListChecks className="h-3.5 w-3.5 shrink-0" style={{ color: grade }} />
            )}
            <Chip label={issue.latest.grade} color={grade} />
            {issue.reopened && <Chip label="reopened" color={RED} />}
            {issue.open ? (
              <Chip
                label={issue.streak > 1 ? `open ${issue.streak} weeks` : "open"}
                color={issue.streak > 1 ? RED : AMBER}
              />
            ) : (
              <Chip label={issue.resolvedIn ? "resolved" : "gone"} color={GREEN} />
            )}
            {issue.adminStatus && (
              <Chip label={STATUS_LABEL[issue.adminStatus]} color={STATUS_COLOR[issue.adminStatus]} />
            )}
            <code className="text-[13px] break-all" style={{ color: MUTED }}>
              {issue.location}
            </code>
          </span>
          <span className="block text-sm leading-relaxed text-[#d4d4d4]">{issue.latest.text}</span>
          <span className="mt-1.5 block text-[13px]" style={{ color: MUTED }}>
            first seen {issue.firstSeen.year}-W{issue.firstSeen.isoWeek}
            {issue.weeks > 1 ? ` · seen in ${issue.weeks} weeks` : ""}
            {issue.resolvedIn ? ` · resolved ${issue.resolvedIn.year}-W${issue.resolvedIn.isoWeek}` : ""}
          </span>
          {issue.reopened && issue.adminStatusWeek && (
            <span className="mt-1.5 flex items-center gap-1.5 text-[13px]" style={{ color: RED }}>
              <RotateCcw className="h-3 w-3 shrink-0" />
              You closed this in {issue.adminStatusWeek.year}-W{issue.adminStatusWeek.isoWeek} and{" "}
              {issue.latest.year}-W{issue.latest.isoWeek} raised it again.
            </span>
          )}
          {issue.adminNote && (
            <span className="mt-1.5 block border-l-2 pl-2 text-[13px] italic" style={{ borderColor: BORDER, color: MUTED }}>
              {issue.adminNote}
            </span>
          )}
        </span>
        <span className="ml-1 mt-0.5 h-8 w-1 shrink-0 rounded-full" style={{ background: accent }} />
      </button>

      {open && (
        <div className="border-t" style={{ borderColor: BORDER }}>
          {/* The operator's verdict — the only thing on this page that is not the writer's. */}
          <div className="px-3 py-2.5">
            <IssueMarkControls issue={issue} newestWeek={newestWeek} />
          </div>

          <div className="border-t px-3 py-2.5" style={{ borderColor: BORDER }}>
            <p className="mb-2 text-xs uppercase tracking-wider" style={{ color: MUTED }}>
              Week by week
            </p>
            <ol className="space-y-2.5">
              {issue.occurrences.map((o, i) => (
                <li key={i} className="border-l-2 pl-3" style={{ borderColor: BORDER }}>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#d4d4d4]">
                      {o.year}-W{o.isoWeek}
                    </span>
                    {o.via === "carry-over" && (
                      <Chip
                        label={o.carryStatus ?? "carried"}
                        color={o.carryStatus === "resolved" ? GREEN : AMBER}
                      />
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed text-[#d4d4d4]">{o.text}</p>
                  <p className="mt-1 text-[13px] leading-relaxed" style={{ color: MUTED }}>
                    → {o.detail}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </li>
  )
}

function DiffCount({ label, n, color }: { label: string; n: number; color: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-base font-semibold tabular-nums" style={{ color: n > 0 ? color : MUTED }}>
        {n}
      </span>
      <span className="text-[13px]" style={{ color: MUTED }}>
        {label}
      </span>
    </span>
  )
}

export function WeeklyOpsIssuesView({
  issues,
  diff,
  newestWeek,
}: {
  issues: OpsIssue[]
  diff: WeekDiff | null
  newestWeek: { year: number; isoWeek: number } | null
}) {
  const [showAll, setShowAll] = useState(false)
  const actionable = issues.filter((i) => i.actionable)
  const rest = issues.length - actionable.length
  const shown = showAll ? issues : actionable
  const reopened = issues.filter((i) => i.reopened).length

  return (
    <div className="space-y-3">
      <div
        className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border px-4 py-2.5"
        style={{ borderColor: BORDER, background: SURFACE }}
      >
        {diff ? (
          <>
            <span className="text-xs uppercase tracking-wider" style={{ color: MUTED }}>
              vs previous week
            </span>
            <DiffCount label="appeared" n={diff.appeared.length} color={RED} />
            <DiffCount label="carried" n={diff.carried.length} color={AMBER} />
            <DiffCount label="cleared" n={diff.resolved.length} color={GREEN} />
          </>
        ) : (
          <span className="text-xs uppercase tracking-wider" style={{ color: MUTED }}>
            one week on record
          </span>
        )}
        {reopened > 0 && <DiffCount label="reopened" n={reopened} color={RED} />}
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="ml-auto text-[13px] transition-colors hover:text-[#f5f5f5]"
          style={{ color: MUTED }}
        >
          {showAll ? "Hide" : "Show"} {rest} handled and closed
        </button>
      </div>

      <HowCalculated>
        <Group title="How an issue is assembled">
          <Steps>
            <Step n="01" title="Every week's entries are collected">
              Each week's <code>system_health.warnings</code>, <code>next_steps</code> and{" "}
              <code>carry_over</code> are read. A next step and the carry-over that continues it
              the following week are the same issue, not two.
            </Step>
            <Step n="02" title="Entries pointing at the same place are compared">
              Two entries can be the same issue only if they share a source and a normalised
              location, so a file path with a step or bracket suffix still matches the file.
            </Step>
            <Step n="03" title="Only the claim is compared">
              The carry-over preamble is stripped and the comparison uses the first clause alone.
              Each week restates a standing problem and appends that week&rsquo;s own evidence,
              which is longer than the claim and different every time — comparing whole texts
              matched almost nothing.
            </Step>
          </Steps>
        </Group>
        <Group title="What the labels mean">
          <Term term="open N weeks">
            Consecutive weeks up to the newest on record. It counts weeks present in the data, so a
            week the cron never ran does not break a streak.
          </Term>
          <Term term="reopened">
            You closed it, and a week later than your verdict raised it again. These sort to the
            top: it means the fix did not hold.
          </Term>
          <Term term="resolved vs gone">
            <span className="text-[#d4d4d4]">Resolved</span> means a week&rsquo;s carry-over
            recorded it as fixed. <span className="text-[#d4d4d4]">Gone</span> means it simply
            stopped appearing, which is not evidence of anything.
          </Term>
        </Group>
        <Group title="Limits worth knowing">
          <Term term="Matching is a heuristic">
            A rewrite that changes the opening words will start a new issue. Grouping was tuned
            against the nineteen weeks on record and is not exact.
          </Term>
          <Term term="Your marks are the only persisted judgement">
            Everything else here is re-derived on each page load from what the writer recorded.
          </Term>
        </Group>
      </HowCalculated>

      {shown.length === 0 ? (
        <p
          className="rounded-lg border p-4 text-base"
          style={{ borderColor: BORDER, background: SURFACE, color: MUTED }}
        >
          Nothing needs attention across the weeks on record.
        </p>
      ) : (
        <ul className="space-y-2">
          {shown.map((i) => (
            <IssueCard key={i.key} issue={i} newestWeek={newestWeek ?? { year: 0, isoWeek: 0 }} />
          ))}
        </ul>
      )}
    </div>
  )
}
