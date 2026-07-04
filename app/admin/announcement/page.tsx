"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function AdminAnnouncementPage() {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch("/api/announcement")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { content?: string } | null) => {
        if (d) setContent(d.content || "")
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/announcement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const data = await res.json().catch(() => ({})) as {
        ok?: boolean
        error?: string
      }
      if (res.ok && data.ok) {
        toast({ title: "Saved", description: "Announcement updated." })
      } else {
        throw new Error(data.error || "Failed")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save announcement.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return null

  return (
    <main
      className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]"
      style={{ colorScheme: "dark" }}
    >
      <div className="mx-auto max-w-2xl px-4 py-8">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-[#8a8a8a] hover:text-[#f5f5f5]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <h1 className="mb-2 text-2xl font-bold text-[#f5f5f5]">
          Site Announcement
        </h1>
        <p className="mb-6 text-sm text-[#8a8a8a]">
          This message scrolls across the top of every page. Leave empty to
          hide.
        </p>

        <div className="rounded-xl border border-[#2f2f2f] bg-[#1c1c1c] p-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your announcement here…"
            rows={4}
            className="mb-4 w-full resize-y rounded-lg border border-[#2f2f2f] bg-[#0f0f0f] px-4 py-3 text-sm text-[#f5f5f5] placeholder:text-[#555] focus:border-cyan-500/50 focus:outline-none"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#555]">
              {content.length} character{content.length !== 1 ? "s" : ""}
            </span>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-9 rounded-lg bg-cyan-600 font-medium text-white hover:bg-cyan-500"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        {content ? (
          <div className="mt-5 rounded-xl border border-cyan-500/15 bg-cyan-950/20 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">
              Preview
            </p>
            <div className="overflow-hidden rounded border border-orange-600/30 bg-orange-950/60 py-1.5">
              <p className="whitespace-nowrap text-sm text-orange-300" style={{ animation: "marquee 20s linear infinite" }}>
                {content}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm text-[#8a8a8a]">
            Announcement is empty — bar is hidden on all pages.
          </p>
        )}

        <Toaster />
      </div>
    </main>
  )
}
