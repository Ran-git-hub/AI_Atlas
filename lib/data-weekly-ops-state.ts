import { createServiceRoleClient } from "@/lib/supabase/service-role"

const TABLE = "AI_Atlas_Weekly_Ops_Issue_State" as const

export const ISSUE_STATUSES = ["acked", "done", "ignored"] as const
export type IssueStatus = (typeof ISSUE_STATUSES)[number]

export function isIssueStatus(v: unknown): v is IssueStatus {
  return typeof v === "string" && (ISSUE_STATUSES as readonly string[]).includes(v)
}

export interface IssueState {
  issueKey: string
  status: IssueStatus
  note: string | null
  /** The newest week on record when the operator set this. */
  statusYear: number
  statusIsoWeek: number
  updatedAt: string
}

export interface IssueStateWrite {
  issueKey: string
  status: IssueStatus
  note: string | null
  statusYear: number
  statusIsoWeek: number
  source: string
  location: string
  sampleText: string
}

export async function getIssueStates(): Promise<Map<string, IssueState>> {
  const supabase = createServiceRoleClient()
  if (!supabase) return new Map()

  const { data, error } = await supabase.from(TABLE).select("*")
  if (error) {
    console.error("[weekly-ops-state] getIssueStates", error.message)
    return new Map()
  }

  const map = new Map<string, IssueState>()
  for (const r of data ?? []) {
    const row = r as Record<string, unknown>
    map.set(String(row.issue_key), {
      issueKey: String(row.issue_key),
      status: row.status as IssueStatus,
      note: (row.note as string | null) ?? null,
      statusYear: Number(row.status_year),
      statusIsoWeek: Number(row.status_iso_week),
      updatedAt: String(row.updated_at),
    })
  }
  return map
}

export async function setIssueState(write: IssueStateWrite): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServiceRoleClient()
  if (!supabase) return { ok: false, error: "no service role client" }

  const { error } = await supabase.from(TABLE).upsert(
    {
      issue_key: write.issueKey,
      status: write.status,
      note: write.note,
      status_year: write.statusYear,
      status_iso_week: write.statusIsoWeek,
      source: write.source,
      location: write.location,
      sample_text: write.sampleText,
    },
    { onConflict: "issue_key" },
  )

  if (error) {
    console.error("[weekly-ops-state] setIssueState", error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

/** Clearing a status removes the row, so "no row" always means "untouched". */
export async function clearIssueState(issueKey: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServiceRoleClient()
  if (!supabase) return { ok: false, error: "no service role client" }

  const { error } = await supabase.from(TABLE).delete().eq("issue_key", issueKey)
  if (error) {
    console.error("[weekly-ops-state] clearIssueState", error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
