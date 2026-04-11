import type { WeeklyReportContent } from "@/lib/types-weekly-report"

export type BlogPostKind = "weekly_report" | "article"

/** Minimal JSON body for `post_kind = article` (extend later). */
export interface BlogArticleContent {
  markdown?: string
  body?: string
}

export interface BlogPostListItem {
  id: string
  postKind: BlogPostKind
  slug: string
  weekStart: string | null
  weekEnd: string | null
  title: string
  summary: string
  tags: string[]
  newUseCasesCount: number
  publishedAt: string
}

export interface BlogPost extends BlogPostListItem {
  content: WeeklyReportContent | BlogArticleContent
  relatedCaseIds: string[]
  newCompaniesCount: number
  countriesCount: number
  industriesCount: number
}

export function isWeeklyBlogPost(
  post: BlogPost,
): post is BlogPost & { postKind: "weekly_report"; content: WeeklyReportContent } {
  return post.postKind === "weekly_report"
}
