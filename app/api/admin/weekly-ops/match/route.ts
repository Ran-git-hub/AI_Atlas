import { NextResponse } from "next/server"
import { getWeeklyAdminRows } from "@/lib/data-weekly-admin"
import { getIssueStates } from "@/lib/data-weekly-ops-state"
import { applyIssueStates, deriveOpsIssues, matchDrafts, type DraftIssue } from "@/lib/weekly-ops-issues"
import { requireAdminApi } from "@/lib/admin-session"

/**
 * The weekly ops writer posts the issues it is about to raise; this answers
 * which of them the operator has already handled.
 *
 * Protected by `middleware.ts` as part of `/api/admin/*`.
 */
export async function POST(request: Request) {
  const denied = await requireAdminApi(request)
  if (denied) return denied
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  if (!Array.isArray(body.drafts)) {
    return NextResponse.json({ ok: false, error: "drafts must be an array" }, { status: 400 })
  }

  const drafts: DraftIssue[] = []
  for (const [i, raw] of body.drafts.entries()) {
    const d = raw as Record<string, unknown>
    if (d.source !== "warning" && d.source !== "next-step") {
      return NextResponse.json(
        { ok: false, error: `drafts[${i}].source must be "warning" or "next-step"` },
        { status: 400 },
      )
    }
    if (typeof d.location !== "string" || typeof d.text !== "string" || !d.text.trim()) {
      return NextResponse.json(
        { ok: false, error: `drafts[${i}] needs a location and a non-empty text` },
        { status: 400 },
      )
    }
    drafts.push({ source: d.source, location: d.location, text: d.text })
  }

  const [rows, states] = await Promise.all([getWeeklyAdminRows(), getIssueStates()])
  const issues = applyIssueStates(deriveOpsIssues(rows), states)

  return NextResponse.json({ ok: true, matches: matchDrafts(drafts, issues) })
}
