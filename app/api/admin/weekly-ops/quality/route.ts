import { NextResponse } from "next/server"
import { buildQualityReport } from "@/app/api/quality/route"
import { requireAdminApi } from "@/lib/admin-session"

export const dynamic = "force-dynamic"

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * One week's data quality, scored by the same rule engine as `/api/quality`.
 *
 * The weekly ops writer calls this once per run and stores the result, so every
 * week's number comes out of one engine and the weeks stay comparable. Before
 * this existed the writer re-implemented a single rule in SQL and called the
 * result "data quality", which was neither the same measure nor comparable with
 * the dashboard's.
 *
 * Protected by `middleware.ts` as part of `/api/admin/*`.
 */
export async function GET(request: Request) {
  const denied = await requireAdminApi(request)
  if (denied) return denied
  const { searchParams } = new URL(request.url)
  const from = searchParams.get("week_start") ?? ""
  const to = searchParams.get("week_end") ?? ""

  if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) {
    return NextResponse.json(
      { ok: false, error: "week_start and week_end must be YYYY-MM-DD" },
      { status: 400 },
    )
  }
  if (from > to) {
    return NextResponse.json({ ok: false, error: "week_start is after week_end" }, { status: 400 })
  }

  const report = await buildQualityReport({ from, to })

  // The full report carries per-rule samples and distributions — 20 KB that
  // nothing downstream reads. Store the score and the rules only.
  return NextResponse.json({
    ok: true,
    source: "quality-engine",
    window: { from, to },
    score: report.score,
    scores: { useCases: report.scores.useCases, companies: report.scores.companies },
    totals: {
      useCases: report.totals.useCases,
      companies: report.totals.companies,
      criticalFailures: report.totals.criticalFailures,
      warningFailures: report.totals.warningFailures,
      infoFailures: report.totals.infoFailures,
    },
    rules: report.rules
      .filter((rule) => rule.failed > 0)
      .map((rule) => ({
        id: rule.id,
        name: rule.name,
        severity: rule.severity,
        total: rule.total,
        failed: rule.failed,
      })),
  })
}
