import { createServiceRoleClient } from "@/lib/supabase/service-role"
import type { WeeklyAdminRow } from "@/lib/types-weekly-admin"

const TABLE = "AI_Atlas_Weekly_Reports_Admin" as const

type Row = Record<string, unknown>

function mapRow(row: Row): WeeklyAdminRow {
  return {
    id: String(row.id),
    year: Number(row.year),
    isoWeek: Number(row.iso_week),
    weekStart: String(row.week_start),
    weekEnd: String(row.week_end),
    slug: (row.slug as string | null) ?? null,
    blogPostId: (row.blog_post_id as string | null) ?? null,
    systemHealth: (row.system_health as WeeklyAdminRow["systemHealth"]) ?? null,
    agentMetrics: (row.agent_metrics as WeeklyAdminRow["agentMetrics"]) ?? null,
    observations: (row.observations as WeeklyAdminRow["observations"]) ?? null,
    searchStrategy: (row.search_strategy as WeeklyAdminRow["searchStrategy"]) ?? null,
    searchToolUsage: (row.search_tool_usage as WeeklyAdminRow["searchToolUsage"]) ?? null,
    dataQuality: (row.data_quality as WeeklyAdminRow["dataQuality"]) ?? null,
    nextSteps: (row.next_steps as WeeklyAdminRow["nextSteps"]) ?? null,
    carryOver: (row.carry_over as WeeklyAdminRow["carryOver"]) ?? null,
    weekStats: (row.week_stats as WeeklyAdminRow["weekStats"]) ?? null,
    updatedAt: String(row.updated_at),
  }
}

/**
 * Newest weeks first. Service role only: the table has RLS enabled with no
 * policies, so the anon client would read zero rows and report it as "no data".
 */
export async function getWeeklyAdminRows(limit = 52): Promise<WeeklyAdminRow[]> {
  const supabase = createServiceRoleClient()
  if (!supabase) {
    console.error("[weekly-admin] no service role client; SUPABASE_SERVICE_ROLE_KEY missing or non-ASCII")
    return []
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("year", { ascending: false })
    .order("iso_week", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[weekly-admin] getWeeklyAdminRows", error.message)
    return []
  }
  return (data ?? []).map((r) => mapRow(r as Row))
}
