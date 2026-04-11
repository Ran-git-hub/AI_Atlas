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

export interface WeeklyReportSection {
  id: string
  title: string
  content: string
}

export interface WeeklyReportContent {
  overview: {
    newUseCases: number
    newCompanies: number
    countriesCount: number
    industriesCount: number
  }
  highlights: WeeklyReportHighlight[]
  trends: WeeklyReportTrend[]
  searchStrategy: {
    queryPerformance: Array<{ query: string; hitRate: string; notes: string }>
    newQueriesAdded: string[]
  }
  dataQuality: {
    issues: Array<{ issue: string; count: number; handling: string }>
  }
  insights: string[]
  nextWeekPlan: string[]
}

export interface WeeklyReport {
  id: string
  weekStart: string
  weekEnd: string
  title: string
  summary: string
  content: WeeklyReportContent
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
