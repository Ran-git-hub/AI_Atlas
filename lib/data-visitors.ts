import { createServiceRoleClient } from "@/lib/supabase/service-role"

/**
 * Visitors before our own record (AI_Atlas_Visits) started: Vercel Web
 * Analytics' all-time "visitors" for production, 2026-03-21 through
 * 2026-10-17. Vercel counts a browser once per day, so returning visitors are
 * counted again on each day they came back - an estimate.
 */
export const VISITORS_BEFORE = 2221
export const VISITORS_BEFORE_UNTIL = "2026-10-17"

export interface VisitorStats {
  total: number
  firstDay: string | null
  today: number
  last7: number
  last30: number
  daily: Array<{ day: string; visitors: number }>
  countries: Array<{ country: string | null; visitors: number }>
}

/** Recorded visitor stats from ai_atlas_visitor_stats(); null when unavailable. */
export async function getVisitorStats(): Promise<VisitorStats | null> {
  const supabase = createServiceRoleClient()
  if (!supabase) return null
  const { data, error } = await supabase.rpc("ai_atlas_visitor_stats")
  if (error) {
    console.error("[visitors] stats failed:", error.message)
    return null
  }
  return data as VisitorStats
}
