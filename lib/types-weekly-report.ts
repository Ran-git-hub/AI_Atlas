export interface WeeklyReportHighlight {
  id: string
  title: string
  company: string
  country: string
  industry: string
  description: string
  significance: string
  use_case_id?: string
}

export interface WeeklyReportTrend {
  title: string
  description: string
}

export interface SystemWarning {
  severity: "info" | "warning" | "critical"
  location: string
  issue: string
  recommendation: string
}

export interface SystemHealth {
  status: "green" | "yellow" | "red"
  label: string
  warnings: SystemWarning[]
}

export interface SearchFallbackStats {
  tavily?: number
  exa_mcp?: number
  xcrawl_search?: number
  mmx_search?: number
  duckduckgo?: number
  free_web_search?: number
}

export interface AgentMetrics {
  runsThisWeek: number
  totalErrorsIntercepted: number
  errorInterceptionRate: string
  reflexLoopTriggers: number
  dataQualityScore: number
  recordsFailedQualityGate: number
  searchFallbackChainInvocations: SearchFallbackStats
}

export interface NextStep {
  priority: "high" | "medium" | "low"
  file: string
  issue: string
  action: string
}

export interface QueryPerformance {
  query: string
  hitRate: "High" | "Medium" | "Low"
  notes: string
}

export interface DataQualityIssue {
  issue: string
  count: number
  handling: string
}

export interface WeeklyReportContent {
  systemHealth: SystemHealth
  overview: {
    newUseCases: number
    newCompanies: number
    countriesCount: number
    industriesCount: number
  }
  agentMetrics: AgentMetrics
  highlights: WeeklyReportHighlight[]
  trends: WeeklyReportTrend[]
  searchStrategy: {
    queryPerformance: QueryPerformance[]
    newQueriesAdded: string[]
  }
  dataQuality: {
    issues: DataQualityIssue[]
  }
  observations: string[]
  nextSteps: NextStep[]
}

export interface WeeklyReport {
  id: string
  weekStart: string
  weekEnd: string
  title: string
  summary: string
  content: WeeklyReportContent
  // tags is text[] in Supabase — stored as flat string array with classification prefixes
  // e.g. ["Weekly", "Multi-Agent Systems", "China AI Scale", "Warning"]
  tags: string[]
  relatedCaseIds: string[]
  newUseCasesCount: number
  newCompaniesCount: number
  countriesCount: number
  industriesCount: number
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export interface WeeklyReportListItem {
  id: string
  weekStart: string
  weekEnd: string
  title: string
  summary: string
  tags: string[]
  newUseCasesCount: number
  publishedAt: string
}
