import type {
  AgentMetrics,
  DataQualityIssue,
  NextStep,
  QueryPerformance,
  SystemHealth,
} from "@/lib/types-weekly-report"

/** One search tool's counters for a single week. */
export interface SearchToolCounters {
  searches: number
  candidates: number
}

export interface SearchToolWeek {
  runCount: number
  tools: Record<string, SearchToolCounters>
  totalSearches: number
  totalCandidates: number
}

export interface SearchToolUsage {
  thisWeek: SearchToolWeek
  lastWeek: SearchToolWeek
  change: { searches: number; candidates: number; notes: string }
}

export interface CarryOverItem {
  fromWeek: string
  step: NextStep
  status: "resolved" | "carried" | "new"
}

export interface StatusBreakdown {
  total: number
  published: number
  pending: number
  archived: number
}

/** The week's pipeline volume: how much came in and how it was dispositioned. */
export interface WeekStats {
  useCaseStatusBreakdown?: StatusBreakdown
  companyStatusBreakdown?: StatusBreakdown
}

export interface QualityRuleFailure {
  id: string
  name: string
  severity: "critical" | "warning" | "info"
  total: number
  failed: number
}

/**
 * Since 2026-09-19 this is the shared quality engine's output for the week
 * (`rules`). Weeks written before that hold a hand-derived score and an
 * `issues` list, so both shapes have to stay readable.
 */
export interface WeekDataQuality {
  score?: number
  source?: string
  window?: { from: string; to: string }
  totals?: { useCases: number; companies: number }
  rules?: QualityRuleFailure[]
  issues?: DataQualityIssue[]
}

/**
 * One week of operations record from `AI_Atlas_Weekly_Reports_Admin`.
 *
 * Every payload field is nullable on purpose: null means the weekly writer did
 * not write that field, which the UI shows differently from a field that was
 * written and came back empty.
 */
export interface WeeklyAdminRow {
  id: string
  year: number
  isoWeek: number
  weekStart: string
  weekEnd: string
  slug: string | null
  blogPostId: string | null
  systemHealth: SystemHealth | null
  agentMetrics: AgentMetrics | null
  observations: string[] | null
  searchStrategy: {
    queryPerformance: QueryPerformance[]
    newQueriesAdded: string[]
  } | null
  searchToolUsage: SearchToolUsage | null
  dataQuality: WeekDataQuality | null
  nextSteps: NextStep[] | null
  carryOver: CarryOverItem[] | null
  weekStats: WeekStats | null
  updatedAt: string
}
