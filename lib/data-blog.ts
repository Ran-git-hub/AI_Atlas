import { createClient } from "@/lib/supabase/server"
import type { WeeklyReportContent } from "@/lib/types-weekly-report"
import type { BlogArticleContent, BlogPost, BlogPostKind, BlogPostListItem } from "@/lib/types-blog"

const TABLE = "AI_Atlas_Blog_Posts" as const

type BlogRow = {
  id: string
  post_kind: string
  slug: string
  week_start: string | null
  week_end: string | null
  title: string
  summary: string | null
  tags: string[] | null
  related_case_ids: string[] | null
  new_use_cases_count: number | null
  new_companies_count: number | null
  countries_count: number | null
  industries_count: number | null
  content: unknown
  published_at: string
}

const LIST_SELECT =
  "id, post_kind, slug, week_start, week_end, title, summary, tags, new_use_cases_count, published_at" as const

function asKind(v: string): BlogPostKind {
  return v === "article" ? "article" : "weekly_report"
}

function mapListRow(row: BlogRow): BlogPostListItem {
  return {
    id: row.id,
    postKind: asKind(row.post_kind),
    slug: row.slug,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    title: row.title,
    summary: row.summary ?? "",
    tags: row.tags ?? [],
    newUseCasesCount: row.new_use_cases_count ?? 0,
    publishedAt: row.published_at,
  }
}

export function normalizeWeeklyReportContent(raw: unknown): WeeklyReportContent {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const ov = o.overview && typeof o.overview === "object" ? (o.overview as Record<string, unknown>) : {}
  const ss = o.searchStrategy && typeof o.searchStrategy === "object" ? (o.searchStrategy as Record<string, unknown>) : {}
  const dq = o.dataQuality && typeof o.dataQuality === "object" ? (o.dataQuality as Record<string, unknown>) : {}

  return {
    overview: {
      newUseCases: Number(ov.newUseCases) || 0,
      newCompanies: Number(ov.newCompanies) || 0,
      countriesCount: Number(ov.countriesCount) || 0,
      industriesCount: Number(ov.industriesCount) || 0,
    },
    highlights: Array.isArray(o.highlights) ? (o.highlights as WeeklyReportContent["highlights"]) : [],
    trends: Array.isArray(o.trends) ? (o.trends as WeeklyReportContent["trends"]) : [],
    searchStrategy: {
      queryPerformance: Array.isArray(ss.queryPerformance)
        ? (ss.queryPerformance as WeeklyReportContent["searchStrategy"]["queryPerformance"])
        : [],
      newQueriesAdded: Array.isArray(ss.newQueriesAdded) ? (ss.newQueriesAdded as string[]) : [],
    },
    dataQuality: {
      issues: Array.isArray(dq.issues) ? (dq.issues as WeeklyReportContent["dataQuality"]["issues"]) : [],
    },
    insights: Array.isArray(o.insights) ? (o.insights as string[]) : [],
    nextWeekPlan: Array.isArray(o.nextWeekPlan) ? (o.nextWeekPlan as string[]) : [],
  }
}

function parseArticleContent(raw: unknown): BlogArticleContent {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return {
    markdown: typeof o.markdown === "string" ? o.markdown : undefined,
    body: typeof o.body === "string" ? o.body : undefined,
  }
}

function mapFullRow(row: BlogRow): BlogPost {
  const kind = asKind(row.post_kind)
  const content =
    kind === "weekly_report" ? normalizeWeeklyReportContent(row.content) : parseArticleContent(row.content)

  return {
    ...mapListRow(row),
    content,
    relatedCaseIds: (row.related_case_ids ?? []).map(String),
    newCompaniesCount: row.new_companies_count ?? 0,
    countriesCount: row.countries_count ?? 0,
    industriesCount: row.industries_count ?? 0,
  }
}

export async function getBlogPosts(): Promise<BlogPostListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from(TABLE).select(LIST_SELECT).order("published_at", { ascending: false })

  if (error) {
    console.error("[blog] getBlogPosts", error.message)
    return []
  }

  return (data as BlogRow[] | null)?.map(mapListRow) ?? []
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from(TABLE).select("*").eq("slug", slug).maybeSingle()

  if (error) {
    console.error("[blog] getBlogPostBySlug", error.message)
    return null
  }
  if (!data) return null

  return mapFullRow(data as BlogRow)
}

export async function getAdjacentBlogPosts(post: BlogPost): Promise<{
  prev: BlogPostListItem | null
  next: BlogPostListItem | null
}> {
  const supabase = await createClient()

  if (post.postKind === "weekly_report" && post.weekStart) {
    const { data: prevRow } = await supabase
      .from(TABLE)
      .select(LIST_SELECT)
      .eq("post_kind", "weekly_report")
      .lt("week_start", post.weekStart)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: nextRow } = await supabase
      .from(TABLE)
      .select(LIST_SELECT)
      .eq("post_kind", "weekly_report")
      .gt("week_start", post.weekStart)
      .order("week_start", { ascending: true })
      .limit(1)
      .maybeSingle()

    return {
      prev: prevRow ? mapListRow(prevRow as BlogRow) : null,
      next: nextRow ? mapListRow(nextRow as BlogRow) : null,
    }
  }

  const { data: prevArticle } = await supabase
    .from(TABLE)
    .select(LIST_SELECT)
    .eq("post_kind", "article")
    .lt("published_at", post.publishedAt)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: nextArticle } = await supabase
    .from(TABLE)
    .select(LIST_SELECT)
    .eq("post_kind", "article")
    .gt("published_at", post.publishedAt)
    .order("published_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  return {
    prev: prevArticle ? mapListRow(prevArticle as BlogRow) : null,
    next: nextArticle ? mapListRow(nextArticle as BlogRow) : null,
  }
}
