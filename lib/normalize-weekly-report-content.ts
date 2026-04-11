import type { WeeklyReportContent } from "@/lib/types-weekly-report"

/** Normalizes JSON from Supabase, SQLite, or admin upserts into `WeeklyReportContent`. */
export function normalizeWeeklyReportContent(raw: unknown): WeeklyReportContent {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const ov = o.overview && typeof o.overview === "object" ? (o.overview as Record<string, unknown>) : {}
  const ss = o.searchStrategy && typeof o.searchStrategy === "object" ? (o.searchStrategy as Record<string, unknown>) : {}
  const dq = o.dataQuality && typeof o.dataQuality === "object" ? (o.dataQuality as Record<string, unknown>) : {}
  const sh = o.systemHealth && typeof o.systemHealth === "object" ? (o.systemHealth as Record<string, unknown>) : {}
  const am = o.agentMetrics && typeof o.agentMetrics === "object" ? (o.agentMetrics as Record<string, unknown>) : {}

  const shWarnings = Array.isArray(sh.warnings) ? (sh.warnings as Record<string, unknown>[]) : []
  const ns = Array.isArray(o.nextSteps) ? (o.nextSteps as Record<string, unknown>[]) : []

  return {
    systemHealth: {
      status: (sh.status as "green" | "yellow" | "red") || "green",
      label: typeof sh.label === "string" ? sh.label : "",
      warnings: shWarnings.map((w) => ({
        severity: (w.severity as "info" | "warning" | "critical") || "info",
        location: typeof w.location === "string" ? w.location : "",
        issue: typeof w.issue === "string" ? w.issue : "",
        recommendation: typeof w.recommendation === "string" ? w.recommendation : "",
      })),
    },
    overview: {
      newUseCases: Number(ov.newUseCases) || 0,
      newCompanies: Number(ov.newCompanies) || 0,
      countriesCount: Number(ov.countriesCount) || 0,
      industriesCount: Number(ov.industriesCount) || 0,
    },
    agentMetrics: {
      runsThisWeek: Number(am.runsThisWeek) || 0,
      totalErrorsIntercepted: Number(am.totalErrorsIntercepted) || 0,
      errorInterceptionRate: typeof am.errorInterceptionRate === "string" ? am.errorInterceptionRate : "0%",
      reflexLoopTriggers: Number(am.reflexLoopTriggers) || 0,
      dataQualityScore: Number(am.dataQualityScore) || 0,
      recordsFailedQualityGate: Number(am.recordsFailedQualityGate) || 0,
      searchFallbackChainInvocations: (am.searchFallbackChainInvocations as Record<string, number>) || {},
    },
    highlights: Array.isArray(o.highlights) ? (o.highlights as WeeklyReportContent["highlights"]) : [],
    trends: Array.isArray(o.trends) ? (o.trends as WeeklyReportContent["trends"]) : [],
    nextSteps: ns.map((s) => ({
      priority: (s.priority as "high" | "medium" | "low") || "medium",
      file: typeof s.file === "string" ? s.file : "",
      issue: typeof s.issue === "string" ? s.issue : "",
      action: typeof s.action === "string" ? s.action : "",
    })),
    searchStrategy: {
      queryPerformance: Array.isArray(ss.queryPerformance)
        ? (ss.queryPerformance as WeeklyReportContent["searchStrategy"]["queryPerformance"])
        : [],
      newQueriesAdded: Array.isArray(ss.newQueriesAdded) ? (ss.newQueriesAdded as string[]) : [],
    },
    dataQuality: {
      issues: Array.isArray(dq.issues) ? (dq.issues as WeeklyReportContent["dataQuality"]["issues"]) : [],
    },
    observations: Array.isArray(o.observations) ? (o.observations as string[]) : [],
  }
}
