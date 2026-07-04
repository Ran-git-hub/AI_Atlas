"use client"

import { useEffect, useState, useRef } from "react"
import { Megaphone } from "lucide-react"

export function AnnouncementBar() {
  const [content, setContent] = useState("")
  const [visible, setVisible] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/announcement")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { content?: string } | null) => {
        if (data?.content) {
          setContent(data.content)
          setVisible(true)
        }
      })
      .catch(() => {})
  }, [])

  // Tell the globe's fixed search bar how much to offset when visible.
  useEffect(() => {
    if (visible && content) {
      document.documentElement.style.setProperty("--announcement-height", "25px")
    } else {
      document.documentElement.style.setProperty("--announcement-height", "0px")
    }
    return () => {
      document.documentElement.style.setProperty("--announcement-height", "0px")
    }
  }, [visible, content])

  if (!visible || !content) return null

  return (
    <div
      ref={barRef}
      className="relative z-[60] flex h-8 items-center overflow-hidden border-b border-orange-600/30 bg-orange-950/60"
    >
      <div className="flex shrink-0 items-center gap-2 px-3">
        <Megaphone className="h-3.5 w-3.5 shrink-0 text-orange-400" />
      </div>
      <div className="flex-1 overflow-hidden">
        <p
          className="inline-block whitespace-nowrap text-sm text-orange-300"
          style={{ animation: "marquee 20s linear infinite" }}
        >
          {content}
        </p>
      </div>
    </div>
  )
}
