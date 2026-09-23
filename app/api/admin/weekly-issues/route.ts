import { NextResponse } from "next/server"
import { clearIssueState, isIssueStatus, setIssueState } from "@/lib/data-weekly-ops-state"
import { requireAdminApi } from "@/lib/admin-session"

/** Protected by `middleware.ts`, which requires a valid `admin_session` on /api/admin/*. */
export async function PATCH(request: Request) {
  const denied = await requireAdminApi(request)
  if (denied) return denied
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const issueKey = typeof body.issueKey === "string" ? body.issueKey : ""
  if (!issueKey) {
    return NextResponse.json({ ok: false, error: "issueKey is required" }, { status: 400 })
  }

  // A null status clears the operator's verdict, so "no row" always means untouched.
  if (body.status === null) {
    const result = await clearIssueState(issueKey)
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  }

  if (!isIssueStatus(body.status)) {
    return NextResponse.json(
      { ok: false, error: "status must be acked, done, ignored, or null" },
      { status: 400 },
    )
  }

  const statusYear = Number(body.statusYear)
  const statusIsoWeek = Number(body.statusIsoWeek)
  if (!Number.isInteger(statusYear) || !Number.isInteger(statusIsoWeek)) {
    return NextResponse.json(
      { ok: false, error: "statusYear and statusIsoWeek are required" },
      { status: 400 },
    )
  }

  const result = await setIssueState({
    issueKey,
    status: body.status,
    note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null,
    statusYear,
    statusIsoWeek,
    source: typeof body.source === "string" ? body.source : "",
    location: typeof body.location === "string" ? body.location : "",
    sampleText: typeof body.sampleText === "string" ? body.sampleText : "",
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
