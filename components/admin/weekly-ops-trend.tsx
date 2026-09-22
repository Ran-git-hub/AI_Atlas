"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import type { WeekTrendPoint } from "@/lib/weekly-ops-issues"

const SURFACE = "#1c1c1c"
const BORDER = "#2f2f2f"
const MUTED = "#8a8a8a"
const GREEN = "#43cc93"
const AMBER = "#f59e0b"
const RED = "#ef4444"

const STATUS_COLOR: Record<string, string> = { green: GREEN, yellow: AMBER, red: RED }
const STATUS_LABEL: Record<string, string> = { green: "OK", yellow: "Warning", red: "Critical" }

/** Bars, not a line: they stay readable at two weeks and at fifty. */
function Sparkbars({
  points,
  max,
  color,
}: {
  points: { label: string; value: number | null }[]
  max: number
  color: string
}) {
  const H = 34
  const gap = 2
  // Reserve a minimum number of slots so a short history reads as a short
  // history — two weeks stay two slim bars instead of stretching to fill.
  const slots = Math.max(points.length, 12)
  const slot = 100 / slots

  return (
    <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="h-[34px] w-full" role="img">
      {points.map((p, i) => {
        const v = p.value ?? 0
        const h = max > 0 ? Math.max((v / max) * H, v > 0 ? 2 : 1) : 1
        const w = slot - gap
        return (
          <rect
            key={i}
            x={i * slot + gap / 4}
            y={H - h}
            width={w > 0 ? w : slot}
            height={h}
            rx={1}
            fill={p.value === null ? BORDER : color}
            opacity={p.value === null ? 1 : i === points.length - 1 ? 1 : 0.45}
          >
            <title>{`${p.label}: ${p.value === null ? "not written" : p.value}`}</title>
          </rect>
        )
      })}
    </svg>
  )
}

function formatRange(weekStart: string): string {
  const start = new Date(`${weekStart}T00:00:00Z`)
  const end = new Date(start.getTime() + 6 * 86400000)
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
  return `${fmt(start)} – ${fmt(end)}`
}

function TrendTile({
  label,
  points,
  color,
  fixedMax,
}: {
  label: string
  points: { label: string; value: number | null }[]
  color: string
  /** Use for scores that are always on a 0–N scale, so the bars stay comparable week to week. */
  fixedMax?: number
}) {
  const values = points.map((p) => p.value).filter((v): v is number => v !== null)
  const max = fixedMax ?? Math.max(...values, 1)
  const latest = points[points.length - 1]?.value ?? null
  const previous = points.length > 1 ? points[points.length - 2]?.value ?? null : null
  const change = latest !== null && previous !== null ? latest - previous : null

  return (
    <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: BORDER, background: SURFACE }}>
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-lg font-semibold tabular-nums" style={{ color: latest === null ? MUTED : "#f5f5f5" }}>
          {latest === null ? "—" : latest}
        </span>
        {change !== null && change !== 0 && (
          <span className="text-[11px] tabular-nums" style={{ color: MUTED }}>
            {change > 0 ? "+" : ""}
            {change}
          </span>
        )}
        <span className="ml-auto text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>
          {label}
        </span>
      </div>
      <Sparkbars points={points} max={max} color={color} />
    </div>
  )
}

/**
 * Cross-week view, and the week selector.
 *
 * The health band is already one segment per week in order, coloured by status,
 * so a separate row of week buttons was drawing the same thing twice — and that
 * row grew by one every week. Selecting happens here instead: the band stays a
 * fixed height however many weeks accumulate.
 */
/**
 * One segment per week, coloured by that week's health.
 *
 * Its selection is the page's mode: nothing selected is the overview, a
 * selected week is that week's record. That is why it is one control rather
 * than a selector in one view and a jump button in another.
 */
export function HealthBand({
  trend,
  selected,
  onSelect,
}: {
  trend: WeekTrendPoint[]
  /** `year-Wweek`, or null in the overview. */
  selected: string | null
  onSelect: (year: number, isoWeek: number) => void
}) {
  if (trend.length === 0) return null
  const label = (p: WeekTrendPoint) => `${p.year}-W${p.isoWeek}`

  // Roughly five ticks, whatever the number of weeks.
  const tickEvery = Math.max(Math.ceil(trend.length / 5), 1)

  // The week number goes inside the block where there is room: few enough
  // weeks, and a wide enough screen. Otherwise the blocks stay the same size
  // and the ticks underneath carry the labels.
  const labelsFit = trend.length <= 26

  return (
    <section className="space-y-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>
          Health
        </span>
        <span className="text-[10px]" style={{ color: MUTED }}>
          — pick a week to open it
        </span>
        <span className="ml-auto text-[10px] tabular-nums" style={{ color: MUTED }}>
          {trend.length} weeks
        </span>
      </div>

      <div className="flex gap-1">
        {trend.map((p) => {
          const isSelected = label(p) === selected
          const color = STATUS_COLOR[p.status ?? ""] ?? BORDER
          const known = Boolean(p.status)
          return (
            <button
              key={label(p)}
              type="button"
              onClick={() => onSelect(p.year, p.isoWeek)}
              aria-label={`${label(p)} — ${p.status ? STATUS_LABEL[p.status] ?? p.status : "not written"}`}
              aria-current={isSelected ? "true" : undefined}
              title={`${label(p)}: ${p.status ? STATUS_LABEL[p.status] ?? p.status : "not written"}`}
              className={
                // Tailwind v4 gives buttons `cursor: default`, so a control that
                // is meant to look clickable has to say so.
                "group relative flex min-w-[6px] flex-1 cursor-pointer items-center justify-center " +
                "rounded-md text-[9px] font-semibold tabular-nums transition-all " +
                "hover:-translate-y-0.5 hover:brightness-110 " +
                (labelsFit ? "h-6" : "h-4")
              }
              style={{
                background: color,
                color: known ? "#1a1a1a" : MUTED,
                outline: isSelected ? "2px solid #f5f5f5" : "1px solid transparent",
                outlineOffset: isSelected ? 2 : 0,
              }}
            >
              {labelsFit && <span className="hidden px-0.5 sm:inline">W{p.isoWeek}</span>}
            </button>
          )
        })}
      </div>

      {/* On a phone the blocks are too narrow for a label inside, so the ticks
          take over there; with many weeks they take over at every width. */}
      <div className={(labelsFit ? "sm:hidden " : "") + "flex gap-1"} aria-hidden>
          {trend.map((p, i) => {
            const isEnd = i === 0 || i === trend.length - 1
            const isTick = isEnd || label(p) === selected || i % tickEvery === 0
            return (
              <span key={label(p)} className="min-w-[6px] flex-1">
                {isTick && (
                  <span
                    className={
                      (isEnd ? "block" : "hidden sm:block") +
                      " whitespace-nowrap text-[9px] tabular-nums " +
                      (i === trend.length - 1 ? "text-right" : i === 0 ? "text-left" : "text-center")
                    }
                    style={{ color: label(p) === selected ? "#f5f5f5" : MUTED }}
                  >
                    W{p.isoWeek}
                  </span>
                )}
              </span>
            )
          })}
      </div>
    </section>
  )
}

/**
 * Cross-week view, and the week selector.
 *
 * The health band is already one segment per week in order, coloured by status,
 * so a separate row of week buttons was drawing the same thing twice — and that
 * row grew by one every week. Selecting happens here instead: the band stays a
 * fixed height however many weeks accumulate.
 */
export function WeeklyOpsTrend({ trend }: { trend: WeekTrendPoint[] }) {
  if (trend.length === 0) return null
  const label = (p: WeekTrendPoint) => `${p.year}-W${p.isoWeek}`

  return (
    <section className="space-y-2.5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TrendTile
          label="Issues raised"
          color={AMBER}
          points={trend.map((p) => ({ label: label(p), value: p.issuesRaised }))}
        />
        <TrendTile
          label="Data quality"
          color={GREEN}
          fixedMax={100}
          points={trend.map((p) => ({ label: label(p), value: p.dataQualityScore }))}
        />
        <TrendTile
          label="Agent runs"
          color={GREEN}
          points={trend.map((p) => ({ label: label(p), value: p.agentRuns }))}
        />
        <TrendTile
          label="Archived %"
          color={AMBER}
          fixedMax={100}
          points={trend.map((p) => ({ label: label(p), value: p.archivedRate }))}
        />
      </div>
    </section>
  )
}

/**
 * Week stepper for the week view.
 *
 * It lives with the weeks, not in the page header: the header sits above the
 * view switch, which made a control that only affects one of three views look
 * like it affected all of them.
 */
export function WeekNav({
  trend,
  selected,
  onSelect,
}: {
  trend: WeekTrendPoint[]
  selected: string | null
  onSelect: (year: number, isoWeek: number) => void
}) {
  const label = (p: WeekTrendPoint) => `${p.year}-W${p.isoWeek}`
  const index = selected ? trend.findIndex((p) => label(p) === selected) : -1
  const current = index >= 0 ? trend[index] : null
  if (!current) return null

  const step = (delta: number) => {
    const next = trend[index + delta]
    if (next) onSelect(next.year, next.isoWeek)
  }

  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-2"
      style={{ borderColor: BORDER, background: SURFACE }}
    >
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={index <= 0}
        className="rounded p-0.5 transition-colors hover:text-[#f5f5f5] disabled:opacity-30"
        style={{ color: MUTED }}
        aria-label="Previous week"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="text-xs font-semibold text-[#f5f5f5]">{label(current)}</span>
      <span className="text-[11px]" style={{ color: MUTED }}>
        {formatRange(current.weekStart)}
      </span>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={index >= trend.length - 1}
        className="rounded p-0.5 transition-colors hover:text-[#f5f5f5] disabled:opacity-30"
        style={{ color: MUTED }}
        aria-label="Next week"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
      <span className="ml-auto text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>
        This view only
      </span>
    </div>
  )
}
