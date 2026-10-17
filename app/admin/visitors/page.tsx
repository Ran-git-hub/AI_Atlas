import { BackToAdminPanel } from "@/components/admin/back-to-admin"
import { requireAdminPage } from "@/lib/admin-session"
import { getVisitorStats } from "@/lib/data-visitors"
import { VisitorStatsView } from "@/components/admin/visitor-stats-view"

export const dynamic = "force-dynamic"

export default async function AdminVisitorsPage() {
  await requireAdminPage()
  const stats = await getVisitorStats()

  return (
    <main className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]" style={{ colorScheme: "dark" }}>
      <div className="mx-auto max-w-5xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#43cc93]/80">
            Admin · Visitors
          </p>
          <BackToAdminPanel />
        </div>
        <h1 className="mb-6 text-2xl font-bold">Visitors</h1>

        {!stats ? (
          <p className="rounded-xl border border-[#2f2f2f] bg-[#1c1c1c] p-5 text-sm text-[#8a8a8a]">
            Visitor stats are unavailable. Check that the AI_Atlas_Visits migration
            has been applied and SUPABASE_SERVICE_ROLE_KEY is set.
          </p>
        ) : (
          <VisitorStatsView stats={stats} />
        )}
      </div>
    </main>
  )
}
