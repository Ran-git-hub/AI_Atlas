"use client"

import { useRouter } from "next/navigation"
import { Layers3, LogOut, Newspaper } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const tiles = [
  {
    label: "Use Cases",
    description: "Browse, edit status, and manage all AI use cases",
    icon: Layers3,
    color: "#43cc93",
    href: "/admin/use-cases",
  },
  {
    label: "News",
    description: "Coming soon — manage news articles and curation",
    icon: Newspaper,
    color: "#60a5fa",
    href: null,
  },
] as const

export default function AdminDashboardPage() {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
  }

  function handleTileClick(href: string | null, label: string) {
    if (href) {
      router.push(href)
    } else {
      toast({
        title: `${label} — Coming soon`,
        description: "This feature will be added in a future update.",
      })
    }
  }

  return (
    <main
      className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]"
      style={{ colorScheme: "dark" }}
    >
      <div className="mx-auto max-w-5xl p-6 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1.5rem,env(safe-area-inset-top,0px))]">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ai-atlas-logo.png"
              alt="AI Atlas"
              className="h-10 w-10 rounded-[10px]"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#f5f5f5]">
                AI Atlas Admin
              </h1>
              <p className="text-sm text-[#8a8a8a]">Management dashboard</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2f2f2f] bg-[#1c1c1c] px-4 py-2 text-sm font-medium text-[#b3b3b3] transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {/* Fiori-style tile grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <button
              key={tile.label}
              type="button"
              onClick={() => handleTileClick(tile.href, tile.label)}
              className="group flex flex-col items-start gap-4 rounded-2xl border border-[#2f2f2f] bg-[#1c1c1c] p-6 text-left transition-all hover:-translate-y-1 hover:border-[#43cc93]/50 hover:shadow-[0_12px_40px_-16px_rgba(67,204,147,0.25)]"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: `${tile.color}18`,
                  color: tile.color,
                }}
              >
                <tile.icon className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#f5f5f5] group-hover:text-[#43cc93] transition-colors">
                  {tile.label}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[#8a8a8a]">
                  {tile.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        <Toaster />
      </div>
    </main>
  )
}
