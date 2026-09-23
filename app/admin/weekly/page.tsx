import { getWeeklyAdminRows } from "@/lib/data-weekly-admin"
import { applyIssueStates, deriveOpsIssues, deriveWeekDiff, deriveWeekTrend } from "@/lib/weekly-ops-issues"
import { getIssueStates } from "@/lib/data-weekly-ops-state"
import { WeeklyOpsPanel } from "@/components/admin/weekly-ops-panel"
import { BackToAdminPanel } from "@/components/admin/back-to-admin"
import { requireAdminPage } from "@/lib/admin-session"

export const dynamic = "force-dynamic"

const WEEK_PARAM = /^\d{4}-W\d{1,2}$/

export default async function AdminWeeklyOpsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdminPage()
  const params = await searchParams
  const [rows, states] = await Promise.all([getWeeklyAdminRows(), getIssueStates()])
  const issues = applyIssueStates(deriveOpsIssues(rows), states)
  const trend = deriveWeekTrend(rows, issues)
  const diff = deriveWeekDiff(rows, issues)

  // `?week=2026-W35` opens that week directly; anything else is the overview.
  const raw = Array.isArray(params.week) ? params.week[0] : params.week
  const initialWeek = raw && WEEK_PARAM.test(raw) ? raw : null

  return (
    <main className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]" style={{ colorScheme: "dark" }}>
      <div className="mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-amber-300/80">
            Admin · Weekly operations
          </p>
          <BackToAdminPanel />
        </div>
        <WeeklyOpsPanel
          rows={rows}
          issues={issues}
          trend={trend}
          diff={diff}
          initialWeek={initialWeek}
        />
      </div>
    </main>
  )
}
