/**
 * Service-role writes to `AI_Atlas_Blog_Posts`. Use from agents, CLI scripts, or trusted
 * server code only — never import from client components or expose to the browser.
 *
 * OpenClaw / REST (upsert weekly example): POST `/rest/v1/AI_Atlas_Blog_Posts?on_conflict=slug`
 * with headers `apikey`, `Authorization: Bearer <SERVICE_ROLE>`, `Content-Type: application/json`,
 * `Prefer: resolution=merge-duplicates`, body array with one row; snake_case columns as in DB.
 *
 * Minimal **article** row (week fields must be omitted or null; `post_kind` = `article`):
 * `slug`, `title`, `summary`, `content` = `{ "markdown": "..." }` or `{ "body": "..." }`,
 * `tags`, `related_case_ids`, counts, `data_sources`, `published_at`.
 */
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import type { WeeklyReportContent } from "@/lib/types-weekly-report"

const TABLE = "AI_Atlas_Blog_Posts" as const

export interface UpsertWeeklyBlogPostInput {
  weekStart: string
  weekEnd: string
  slug: string
  title: string
  summary: string
  content: WeeklyReportContent
  tags: string[]
  relatedCaseIds: string[]
  newUseCasesCount: number
  newCompaniesCount: number
  countriesCount: number
  industriesCount: number
  dataSources?: Record<string, unknown>
}

export async function upsertWeeklyBlogPost(input: UpsertWeeklyBlogPostInput): Promise<{ id: string }> {
  const supabase = createServiceRoleClient()
  if (!supabase) {
    throw new Error("[blog-admin] SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required.")
  }

  const now = new Date().toISOString()

  const row = {
    post_kind: "weekly_report" as const,
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    content: input.content,
    tags: input.tags,
    related_case_ids: input.relatedCaseIds,
    week_start: input.weekStart,
    week_end: input.weekEnd,
    new_use_cases_count: input.newUseCasesCount,
    new_companies_count: input.newCompaniesCount,
    countries_count: input.countriesCount,
    industries_count: input.industriesCount,
    data_sources: input.dataSources ?? {},
    published_at: now,
    updated_at: now,
  }

  const { data, error } = await supabase.from(TABLE).upsert(row, { onConflict: "slug" }).select("id").single()

  if (error) {
    throw new Error(`[blog-admin] upsert failed: ${error.message}`)
  }

  return { id: String(data?.id ?? "") }
}
