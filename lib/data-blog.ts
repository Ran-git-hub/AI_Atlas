import { createClient } from "@/lib/supabase/server"
import { normalizeWeeklyReportContent } from "@/lib/normalize-weekly-report-content"
import type { BlogArticleContent, BlogPost, BlogPostKind, BlogPostListItem } from "@/lib/types-blog"

export { normalizeWeeklyReportContent } from "@/lib/normalize-weekly-report-content"

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

function weeklySlugToWeekStart(slug: string): string | null {
  const m = /^weekly-(\d{4}-\d{2}-\d{2})$/.exec(slug)
  return m ? m[1] : null
}

/**
 * When Supabase has no row for `weekly-YYYY-MM-DD`, serve an in-memory stub.
 * On by default so local / mis-synced env (e.g. `vercel env pull` setting `VERCEL=1`) never yields a blind 404.
 * Strict 404 on missing weeklies: set `BLOG_DISABLE_WEEKLY_STUB=true`.
 */
function allowStubWeeklyWhenMissing(): boolean {
  const off = process.env.BLOG_DISABLE_WEEKLY_STUB
  return off !== "1" && off !== "true"
}

function normalizeBlogSlugParam(raw: string): string {
  let s = raw.trim()
  while (s.endsWith("/")) s = s.slice(0, -1)
  try {
    s = decodeURIComponent(s)
  } catch {
    /* keep s */
  }
  return s
}

function weekRangeFromStart(weekStart: string): { weekStart: string; weekEnd: string } {
  const start = new Date(`${weekStart}T12:00:00Z`)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 6)
  const weekEnd = end.toISOString().slice(0, 10)
  return { weekStart, weekEnd }
}

function buildStubWeeklyBlogPost(slug: string): BlogPost | null {
  const ws = weeklySlugToWeekStart(slug)
  if (!ws) return null
  const { weekStart, weekEnd } = weekRangeFromStart(ws)
  const publishedAt = `${weekStart}T12:00:00.000Z`
  return {
    id: `local-stub:${slug}`,
    postKind: "weekly_report",
    slug,
    weekStart,
    weekEnd,
    title: `AI Atlas Weekly Report — Week of ${weekStart}`,
    summary:
      "This week is not in the database yet. Generate and save a weekly post to Supabase, or open an existing slug from /blog.",
    tags: ["Weekly", "Preview"],
    newUseCasesCount: 0,
    publishedAt,
    content: normalizeWeeklyReportContent({}),
    relatedCaseIds: [],
    newCompaniesCount: 0,
    countriesCount: 0,
    industriesCount: 0,
  }
}

function blogPostToListItem(p: BlogPost): BlogPostListItem {
  return {
    id: p.id,
    postKind: p.postKind,
    slug: p.slug,
    weekStart: p.weekStart,
    weekEnd: p.weekEnd,
    title: p.title,
    summary: p.summary,
    tags: p.tags,
    newUseCasesCount: p.newUseCasesCount,
    publishedAt: p.publishedAt,
  }
}

/** List sort: weeklies by `week_start` (matches cyan date range on /blog); articles by `published_at`. */
function blogListSortKeyMs(post: BlogPostListItem): number {
  if (post.postKind === "weekly_report") {
    const d = post.weekStart ?? post.weekEnd
    if (d) {
      const t = Date.parse(`${d}T12:00:00Z`)
      if (!Number.isNaN(t)) return t
    }
  }
  const t = Date.parse(post.publishedAt)
  return Number.isNaN(t) ? 0 : t
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
  let remote: BlogPostListItem[] = []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from(TABLE).select(LIST_SELECT).order("published_at", { ascending: false })

    if (error) {
      console.error("[blog] getBlogPosts", error.message)
    } else {
      remote = (data as BlogRow[] | null)?.map(mapListRow) ?? []
    }
  } catch (e) {
    console.error("[blog] getBlogPosts", e)
  }

  let merged = [...remote].sort((a, b) => blogListSortKeyMs(b) - blogListSortKeyMs(a))

  if (merged.length === 0 && allowStubWeeklyWhenMissing()) {
    const stub = buildStubWeeklyBlogPost("weekly-2026-04-04")
    if (stub) merged = [blogPostToListItem(stub)]
  }

  return merged
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const slugNorm = normalizeBlogSlugParam(slug)
  let post: BlogPost | null = null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from(TABLE).select("*").eq("slug", slugNorm).maybeSingle()

    if (error) {
      console.error("[blog] getBlogPostBySlug", error.message)
    } else if (data) {
      post = mapFullRow(data as BlogRow)
    }
  } catch (e) {
    console.error("[blog] getBlogPostBySlug", e)
  }

  if (!post && allowStubWeeklyWhenMissing()) {
    post = buildStubWeeklyBlogPost(slugNorm)
  }
  return post
}

export async function getAdjacentBlogPosts(post: BlogPost): Promise<{
  prev: BlogPostListItem | null
  next: BlogPostListItem | null
}> {
  const supabase = await createClient()

  if (post.postKind === "weekly_report" && post.weekStart) {
    if (post.id.startsWith("local-stub:")) {
      return { prev: null, next: null }
    }

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
