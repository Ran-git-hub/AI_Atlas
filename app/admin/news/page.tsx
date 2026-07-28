import { getAdminNewsItems } from "@/lib/data-news"
import type { NewsItem } from "@/lib/types-news"
import { AdminNewsTable } from "@/components/news/admin-news-table"

export const dynamic = "force-dynamic"

export default async function AdminNewsPage() {
  const items = await getAdminNewsItems()

  return (
    <main
      className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]"
      style={{ colorScheme: "dark" }}
    >
      <div className="mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-amber-300/80">
          Admin · News management
        </p>
        <AdminNewsTable items={items} />
      </div>
    </main>
  )
}
