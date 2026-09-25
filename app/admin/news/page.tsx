import { getAdminNewsItems } from "@/lib/data-news"
import type { NewsItem } from "@/lib/types-news"
import { AdminNewsTable } from "@/components/news/admin-news-table"
import { BackToAdminPanel } from "@/components/admin/back-to-admin"
import { requireAdminPage } from "@/lib/admin-session"

export const dynamic = "force-dynamic"

export default async function AdminNewsPage() {
  await requireAdminPage()
  const items = await getAdminNewsItems()

  return (
    <main
      className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]"
      style={{ colorScheme: "dark" }}
    >
      <div className="mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-amber-300/80">
            Admin · News management
          </p>
          <BackToAdminPanel />
        </div>
        <AdminNewsTable items={items} />
      </div>
    </main>
  )
}
