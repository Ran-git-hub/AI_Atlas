"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Database,
  Filter,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react"
import { AtlasAppTopRow } from "@/components/atlas-app-top-row"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"
import { cn } from "@/lib/utils"

import { formatAtlasDateTime } from "@/lib/format-date"
type Severity = "critical" | "warning" | "info"
type Dimension = "Completeness" | "Validity" | "Consistency" | "Uniqueness" | "Traceability"
type TableName = "Use Cases" | "Companies"

type IssueSample = {
  id: string
  label: string
  detail?: string
}

type RuleResult = {
  id: string
  name: string
  table: TableName
  dimension: Dimension
  severity: Severity
  total: number
  failed: number
  samples: IssueSample[]
  displayCode?: string
}

type QualityResponse = {
  generatedAt: string
  elapsedMs: number
  score: number
  scores: {
    overall: number
    useCases: number
    companies: number
    weights?: {
      useCases: number
      companies: number
    }
  }
  totals: {
    useCases: number
    companies: number
    useCaseStatuses: StatusCounts
    companyStatuses: StatusCounts
    criticalFailures: number
    warningFailures: number
    infoFailures: number
  }
  rules: RuleResult[]
  distributions: {
    useCaseIndustry: [string, number][]
    useCaseCountry: [string, number][]
    useCaseContinent: [string, number][]
    companyIndustry: [string, number][]
    companyCountry: [string, number][]
    sourceDomain: [string, number][]
    useCaseType: [string, number][]
  }
}

type StatusCounts = {
  total: number
  published: number
  pending: number
  archive: number
  other: number
}

const DIMENSION_ORDER: Dimension[] = [
  "Completeness",
  "Validity",
  "Consistency",
  "Uniqueness",
  "Traceability",
]

const TABLE_META: Record<TableName, { icon: LucideIcon; accent: string; glow: string; description: string }> = {
  "Use Cases": {
    icon: Sparkles,
    accent: "text-[#3cb371]",
    glow: "shadow-[0_0_24px_rgba(60,179,113,0.12)]",
    description: "Deployment records, source URLs, content, location, and company linkage.",
  },
  Companies: {
    icon: Building2,
    accent: "text-cyan-300",
    glow: "shadow-[0_0_24px_rgba(34,211,238,0.12)]",
    description: "Organization master data, GICS classification, headquarters, website, and descriptions.",
  },
}

function tableDisplayName(table: TableName): string {
  return table === "Companies" ? "Organizations" : table
}

function passRate(rule: RuleResult) {
  if (rule.total <= 0) return 100
  return ((rule.total - rule.failed) / rule.total) * 100
}

function tablePassRate(rules: RuleResult[]) {
  const total = rules.reduce((sum, rule) => sum + rule.total, 0)
  const failed = rules.reduce((sum, rule) => sum + rule.failed, 0)
  if (total <= 0) return 100
  return ((total - failed) / total) * 100
}

function statusTone(rate: number) {
  if (rate >= 95) {
    return {
      label: "Good",
      chip: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
      bar: "bg-emerald-400",
      icon: "text-emerald-300",
    }
  }
  if (rate >= 90) {
    return {
      label: "Review",
      chip: "border-amber-300/30 bg-amber-300/10 text-amber-200",
      bar: "bg-amber-300",
      icon: "text-amber-200",
    }
  }
  return {
    label: "Fail",
    chip: "border-red-400/30 bg-red-400/10 text-red-300",
    bar: "bg-red-400",
    icon: "text-red-300",
  }
}

function severityChip(severity: Severity) {
  if (severity === "critical") return "border-red-400/25 bg-red-400/10 text-red-200"
  if (severity === "warning") return "border-amber-300/25 bg-amber-300/10 text-amber-100"
  return "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
}

function severityLabel(severity: Severity) {
  if (severity === "critical") return "High"
  if (severity === "warning") return "Medium"
  return "Low"
}

function ScoreStatusCard({
  score,
  tone,
  className,
}: {
  score: number
  tone: ReturnType<typeof statusTone>
  className?: string
}) {
  return (
    <div className={cn("w-full rounded-lg border border-slate-700/70 bg-slate-950/45 p-3 sm:w-56 sm:min-w-56 sm:max-w-56 sm:shrink-0", className)}>
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold leading-none tabular-nums text-white">{score.toFixed(1)}</span>
          <span className="text-base font-semibold text-slate-400">/100</span>
        </div>
        <span className={cn("rounded-md border px-2.5 py-1 text-sm font-semibold", tone.chip)}>
          {tone.label}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
    </div>
  )
}

function TableSummaryCard({
  table,
  records,
  statusCounts,
  score,
  highFailures,
  mediumFailures,
  lowFailures,
  rules,
}: {
  table: TableName
  records: number
  statusCounts: StatusCounts
  score: number
  highFailures: number
  mediumFailures: number
  lowFailures: number
  rules: number
}) {
  const meta = TABLE_META[table]
  const tone = statusTone(score)
  const Icon = meta.icon
  const totalFailures = highFailures + mediumFailures + lowFailures
  const maxFailures = Math.max(highFailures, mediumFailures, lowFailures, 1)
  const stats = [
    { label: "Published", value: records },
    { label: "Pending", value: statusCounts.pending },
    { label: "Archive", value: statusCounts.archive },
  ]

  return (
    <div className={cn("rounded-xl border border-slate-700/70 bg-slate-900/70 p-4 backdrop-blur-md", meta.glow)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="mt-3 flex min-w-0 items-center gap-3">
          <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-2.5">
            <Icon className={cn("h-5 w-5", meta.accent)} />
          </div>
          <div className="min-w-0 truncate text-sm font-semibold uppercase tracking-wide text-slate-400">{tableDisplayName(table)}</div>
        </div>

        <ScoreStatusCard score={score} tone={tone} />
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-lg border border-slate-700/70 bg-slate-950/35 px-4 py-3">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">Failures By Severity</div>
              <div className="mt-1 text-base font-semibold tabular-nums text-slate-100">{totalFailures.toLocaleString()} total failures</div>
            </div>
            <div className="rounded-md border border-slate-700/70 bg-slate-900/60 px-2 py-1 text-xs font-medium text-slate-400">
              High x3 · Medium x2 · Low x1
            </div>
          </div>

          {[
            { label: "High", value: highFailures, weight: "x3", valueClass: "text-slate-100 font-bold" },
            { label: "Medium", value: mediumFailures, weight: "x2", valueClass: "text-slate-200 font-semibold" },
            { label: "Low", value: lowFailures, weight: "x1", valueClass: "text-slate-300 font-semibold" },
          ].map((item) => (
            <div key={item.label} className="grid grid-cols-[4.75rem_minmax(0,1fr)_4.5rem] items-center gap-3 py-1.5">
              <div className="text-sm font-medium text-slate-400">{item.label}</div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-slate-400"
                  style={{ width: `${(item.value / maxFailures) * 100}%` }}
                />
              </div>
              <div className="text-right text-sm">
                <span className={cn("tabular-nums", item.valueClass)}>{item.value.toLocaleString()}</span>
                <span className="ml-1 text-xs text-slate-500">{item.weight}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-700/70 bg-slate-950/40 px-3 py-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</div>
              <div className="mt-1 text-2xl font-semibold leading-none tabular-nums text-white">{item.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function RuleCard({ rule }: { rule: RuleResult }) {
  const rate = passRate(rule)
  const tone = statusTone(rate)

  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-900/65 p-2.5 backdrop-blur-md">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {rule.displayCode ? (
              <span className="rounded-md border border-cyan-300/25 bg-cyan-300/10 px-2 py-0.5 text-xs font-semibold text-cyan-100">
                {rule.displayCode}
              </span>
            ) : null}
            <span className="rounded-md border border-slate-700 bg-slate-800/70 px-2 py-0.5 text-xs font-medium text-slate-300">
              {rule.dimension}
            </span>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-white">{rule.name}</h3>
          <div className="mt-1 text-xs text-slate-400">
            {(rule.total - rule.failed).toLocaleString()} passed / {rule.total.toLocaleString()} checked
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-56">
          <div className="mb-2 grid gap-1.5 text-xs lg:grid-cols-2">
            <div className="rounded-md border border-slate-700 bg-slate-950/45 px-2 py-1">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Status</div>
              <div className={cn("mt-0.5 font-semibold", tone.icon)}>{tone.label}</div>
            </div>
            <div className="rounded-md border border-slate-700 bg-slate-950/45 px-2 py-1">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Severity</div>
              <div
                className={cn(
                  "mt-0.5 capitalize text-slate-200",
                  rule.severity === "critical" ? "font-bold" : "font-semibold"
                )}
              >
                {severityLabel(rule.severity)}
              </div>
            </div>
          </div>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
            <span>{rate.toFixed(1)}%</span>
            <span>{rule.failed.toLocaleString()} failed</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${Math.max(0, Math.min(100, rate))}%` }} />
          </div>
        </div>
      </div>

      {rule.failed > 0 && rule.samples.length > 0 ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-medium text-slate-300 hover:text-white">
            Show examples
          </summary>
          <div className="mt-2 overflow-hidden rounded-md border border-slate-700">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Record</th>
                  <th className="px-3 py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {rule.samples.map((item) => (
                  <tr key={`${rule.id}-${item.id}-${item.label}`} className="border-t border-slate-800">
                    <td className="max-w-[420px] truncate px-3 py-2 text-slate-200">{item.label}</td>
                    <td className="max-w-[420px] truncate px-3 py-2 text-slate-400">{item.detail ?? item.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </div>
  )
}

function DimensionPill({ dimension, rules }: { dimension: Dimension; rules: RuleResult[] }) {
  const rate = tablePassRate(rules)
  const tone = statusTone(rate)

  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-950/35 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-300">{dimension}</span>
        <span className={cn("text-xs font-semibold tabular-nums", tone.icon)}>{rate.toFixed(1)}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${Math.max(0, Math.min(100, rate))}%` }} />
      </div>
    </div>
  )
}

function TableQualitySection({
  table,
  score,
  rules,
  filteredRules,
}: {
  table: TableName
  score: number
  rules: RuleResult[]
  filteredRules: RuleResult[]
}) {
  const meta = TABLE_META[table]
  const Icon = meta.icon
  const rate = score
  const tone = statusTone(score)
  const failed = rules.reduce((sum, rule) => sum + rule.failed, 0)
  const criticalRules = rules.filter((rule) => rule.severity === "critical" && rule.failed > 0).length
  const numberedRules = useMemo(() => {
    const prefix = table === "Use Cases" ? "UC" : "CO"
    const byId = new Map(rules.map((rule, index) => [rule.id, `${prefix}-${String(index + 1).padStart(2, "0")}`]))
    return filteredRules.map((rule) => ({
      ...rule,
      displayCode: byId.get(rule.id),
    }))
  }, [filteredRules, rules, table])

  return (
    <section className={cn("rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 backdrop-blur-md", meta.glow)}>
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-md border border-slate-700 bg-slate-800/70 p-2">
            <Icon className={cn("h-5 w-5", meta.accent)} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{tableDisplayName(table)}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-400">{meta.description}</p>
          </div>
        </div>

        <div className="w-full rounded-lg border border-slate-700/70 bg-slate-950/45 p-3 lg:w-72">
          <div className="flex items-center justify-between">
            <span className={cn("rounded-md border px-2 py-1 text-xs font-semibold", tone.chip)}>{tone.label}</span>
            <span className="text-2xl font-semibold tabular-nums text-white">{rate.toFixed(1)}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${Math.max(0, Math.min(100, rate))}%` }} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs text-slate-400">
            <div>{rules.length} rules</div>
            <div className="text-right">{failed.toLocaleString()} failures</div>
            <div>{criticalRules} high severity rules</div>
            <div className="text-right">{filteredRules.length} visible</div>
          </div>
        </div>
      </div>

      <div className="mt-2.5 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        {DIMENSION_ORDER.map((dimension) => (
          <DimensionPill key={`${table}-${dimension}`} dimension={dimension} rules={rules.filter((rule) => rule.dimension === dimension)} />
        ))}
      </div>

      <div className="mt-2.5 grid gap-2">
        {filteredRules.length > 0 ? (
          numberedRules.map((rule) => <RuleCard key={rule.id} rule={rule} />)
        ) : (
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-200">
            No rules match the current filters for this table.
          </div>
        )}
      </div>
    </section>
  )
}

export function QualityDashboard({ latestDataUpdateCet }: { latestDataUpdateCet: string }) {
  const [data, setData] = useState<QualityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dimension, setDimension] = useState<Dimension | "All">("All")
  const [severity, setSeverity] = useState<Severity | "All">("All")
  const [showOnlyIssues, setShowOnlyIssues] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/quality", { cache: "no-store" })
      if (!response.ok) throw new Error(`Quality API returned ${response.status}`)
      setData(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data quality results")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredRules = useMemo(() => {
    return (data?.rules ?? []).filter((rule) => {
      if (dimension !== "All" && rule.dimension !== dimension) return false
      if (severity !== "All" && rule.severity !== severity) return false
      if (showOnlyIssues && rule.failed === 0) return false
      return true
    })
  }, [data, dimension, severity, showOnlyIssues])

  const tableRules = useMemo(() => {
    return {
      "Use Cases": (data?.rules ?? []).filter((rule) => rule.table === "Use Cases"),
      Companies: (data?.rules ?? []).filter((rule) => rule.table === "Companies"),
    } satisfies Record<TableName, RuleResult[]>
  }, [data])

  const filteredTableRules = useMemo(() => {
    return {
      "Use Cases": filteredRules.filter((rule) => rule.table === "Use Cases"),
      Companies: filteredRules.filter((rule) => rule.table === "Companies"),
    } satisfies Record<TableName, RuleResult[]>
  }, [filteredRules])

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto mb-5 max-w-7xl">
          <AtlasAppTopRow />
        </div>
        <div className="mx-auto max-w-4xl rounded-lg border border-red-400/30 bg-slate-900/80 p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-300" />
          <h1 className="mt-4 text-xl font-semibold">Data quality dashboard failed to load</h1>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
        <div className="mx-auto mt-8 max-w-7xl">
          <AtlasSiteFooter latestDataUpdateCet={latestDataUpdateCet} layout="inline" />
        </div>
      </main>
    )
  }

  const scoreTone = statusTone(data?.score ?? 100)
  const useCaseScoreTone = statusTone(data?.scores.useCases ?? 100)
  const companyScoreTone = statusTone(data?.scores.companies ?? 100)
  const useCaseWeight = data?.scores.weights?.useCases ?? 90
  const companyWeight = data?.scores.weights?.companies ?? 10
  const useCaseCriticalFailures = tableRules["Use Cases"]
    .filter((rule) => rule.severity === "critical")
    .reduce((sum, rule) => sum + rule.failed, 0)
  const useCaseWarningFailures = tableRules["Use Cases"]
    .filter((rule) => rule.severity === "warning")
    .reduce((sum, rule) => sum + rule.failed, 0)
  const useCaseLowFailures = tableRules["Use Cases"]
    .filter((rule) => rule.severity === "info")
    .reduce((sum, rule) => sum + rule.failed, 0)
  const companyCriticalFailures = tableRules.Companies
    .filter((rule) => rule.severity === "critical")
    .reduce((sum, rule) => sum + rule.failed, 0)
  const companyWarningFailures = tableRules.Companies
    .filter((rule) => rule.severity === "warning")
    .reduce((sum, rule) => sum + rule.failed, 0)
  const companyLowFailures = tableRules.Companies
    .filter((rule) => rule.severity === "info")
    .reduce((sum, rule) => sum + rule.failed, 0)

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_85%_8%,rgba(60,179,113,0.13),transparent_30%),linear-gradient(180deg,#020a18_0%,#0f172a_48%,#020617_100%)] text-white">
      <header className="border-b border-slate-700/70 bg-slate-950/70 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <AtlasAppTopRow />
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-slate-800/80 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-md border border-cyan-300/30 bg-cyan-300/10 p-2">
              <Database className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-normal">AI Atlas Data Quality</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                Live dashboard for the AI Atlas quality rules, split by Organizations and Use Cases.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {data ? (
              <span className="text-xs text-slate-400">
                Generated {formatAtlasDateTime(data.generatedAt)} in {(data.elapsedMs / 1000).toFixed(1)}s
              </span>
            ) : null}
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-3 px-6 py-3">
        {loading && !data ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-lg border border-slate-700 bg-slate-900/70" />
            ))}
          </div>
        ) : null}

        {data ? (
          <>
            <section className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-3.5 backdrop-blur-md">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="mt-1 flex min-w-0 items-center gap-3">
                  <div className="rounded-lg border border-slate-700 bg-slate-950/45 p-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="text-xl font-semibold uppercase tracking-wide text-slate-100">Overall Quality Score</div>
                </div>

                <ScoreStatusCard score={data.scores.overall} tone={scoreTone} />
              </div>

              <div className="mt-3 grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.04] px-3.5 py-2.5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200/80">Composite Formula</div>
                    <div className="mt-1 text-base font-medium leading-6 text-slate-200">
                      Overall = <span className="text-emerald-300">Use Cases score x {useCaseWeight}%</span>
                      <span className="text-slate-500"> + </span>
                      <span className="text-cyan-200">Organizations score x {companyWeight}%</span>
                    </div>
                  </div>

                  <div className="mt-2.5 grid gap-1.5 md:grid-cols-3">
                    {[
                      { label: "Failure Rate", value: "failed records / published records x 100" },
                      { label: "Rule Score", value: "100 - failure rate x severity multiplier", weights: "High x3 · Medium x2 · Low x1" },
                      { label: "Table Score", value: "weighted average of rule scores", colors: ["Green >= 95", "Orange 90-94.9", "Red < 90"] },
                    ].map((item, index) => (
                      <div key={item.label} className="flex min-w-0 items-center gap-2 rounded-md border border-slate-700/70 bg-slate-950/35 px-2.5 py-1.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-[11px] font-semibold text-slate-300">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">{item.label}</span>
                          <span className="ml-2 text-sm leading-5 text-slate-400">{item.value}</span>
                          {"weights" in item ? (
                            <span className="ml-2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-900/70 px-1.5 py-0.5 text-xs font-medium text-slate-300">
                              {item.weights}
                            </span>
                          ) : null}
                          {"colors" in item ? (
                            <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
                              <span className="rounded-md border border-emerald-400/25 bg-emerald-400/10 px-1.5 py-0.5 text-xs font-medium text-emerald-300">
                                {item.colors[0]}
                              </span>
                              <span className="rounded-md border border-amber-300/25 bg-amber-300/10 px-1.5 py-0.5 text-xs font-medium text-amber-200">
                                {item.colors[1]}
                              </span>
                              <span className="rounded-md border border-red-400/25 bg-red-400/10 px-1.5 py-0.5 text-xs font-medium text-red-300">
                                {item.colors[2]}
                              </span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-2.5 lg:grid-cols-2">
              <TableSummaryCard
                table="Use Cases"
                records={data.totals.useCases}
                statusCounts={data.totals.useCaseStatuses}
                score={data.scores.useCases}
                highFailures={useCaseCriticalFailures}
                mediumFailures={useCaseWarningFailures}
                lowFailures={useCaseLowFailures}
                rules={tableRules["Use Cases"].length}
              />
              <TableSummaryCard
                table="Companies"
                records={data.totals.companies}
                statusCounts={data.totals.companyStatuses}
                score={data.scores.companies}
                highFailures={companyCriticalFailures}
                mediumFailures={companyWarningFailures}
                lowFailures={companyLowFailures}
                rules={tableRules.Companies.length}
              />
            </section>

            <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-2.5 backdrop-blur-md">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-cyan-300" />
                    <h2 className="text-base font-semibold">Rule Status</h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-300">
                    <Filter className="h-4 w-4" />
                    Filters
                  </div>
                  <select
                    value={dimension}
                    onChange={(event) => setDimension(event.target.value as Dimension | "All")}
                    className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="All">All dimensions</option>
                    {DIMENSION_ORDER.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <select
                    value={severity}
                    onChange={(event) => setSeverity(event.target.value as Severity | "All")}
                    className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="All">All severities</option>
                    <option value="critical">High</option>
                    <option value="warning">Medium</option>
                    <option value="info">Low</option>
                  </select>
                  <label className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={showOnlyIssues}
                      onChange={(event) => setShowOnlyIssues(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-500 bg-slate-950"
                    />
                    Issues only
                  </label>
                </div>
              </div>
            </section>

            <TableQualitySection
              table="Use Cases"
              score={data.scores.useCases}
              rules={tableRules["Use Cases"]}
              filteredRules={filteredTableRules["Use Cases"]}
            />
            <TableQualitySection
              table="Companies"
              score={data.scores.companies}
              rules={tableRules.Companies}
              filteredRules={filteredTableRules.Companies}
            />
          </>
        ) : null}
      </div>
      <div className="mx-auto mt-8 max-w-7xl px-6 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]">
        <AtlasSiteFooter latestDataUpdateCet={latestDataUpdateCet} layout="inline" />
      </div>
    </main>
  )
}
