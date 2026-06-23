"use client"

import { useEffect, useState } from "react"

function sourceInitial(source: string): string {
  const trimmed = source.trim()
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "N"
}

function brandLabel(sourceName: string): string {
  return sourceName.replace(/\s+via Follow Builders$/i, "").trim() || sourceName
}

function brandTone(sourceName: string): string {
  const source = sourceName.toLowerCase()
  if (source.includes("aaron levie")) return "from-cyan-950 via-slate-900 to-emerald-950"
  if (source.includes("boris cherny")) return "from-indigo-950 via-slate-900 to-cyan-950"
  if (source.includes("thibault")) return "from-sky-950 via-slate-900 to-violet-950"
  if (source.includes("claude")) return "from-stone-900 via-slate-900 to-orange-950"
  if (source.includes("podcast")) return "from-purple-950 via-slate-900 to-cyan-950"
  return "from-slate-950 via-slate-900 to-cyan-950"
}

const HACKER_NEWS_FALLBACK = "/hacker-news-fallback.jpg"

function isHackerNewsSource(sourceName: string): boolean {
  return /\bhacker news\b/i.test(sourceName.trim())
}

function isXSource(articleUrl: string | null, sourceName: string): boolean {
  if (/\bon x$/i.test(sourceName.trim())) return true

  if (!articleUrl) return false

  try {
    const hostname = new URL(articleUrl).hostname.replace(/^www\./, "")
    return hostname === "x.com" || hostname === "twitter.com"
  } catch {
    return false
  }
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10 fill-white" aria-label="X.com">
      <path d="M18.9 2h3.7l-8.1 9.3L24 22h-7.4l-5.8-7.6L4.2 22H.5l8.7-10L0 2h7.6l5.2 6.9L18.9 2Zm-1.3 18.1h2.1L6.5 3.8H4.3l13.3 16.3Z" />
    </svg>
  )
}

export function NewsCardImage({
  articleUrl,
  sourceName,
}: {
  articleUrl: string | null
  sourceName: string
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const useXIcon = isXSource(articleUrl, sourceName)

  useEffect(() => {
    setImageUrl(null)
    setLoaded(false)

    if (useXIcon) return
    if (!articleUrl) return

    const controller = new AbortController()
    fetch(`/api/news-image?url=${encodeURIComponent(articleUrl)}&version=2`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        if (!data || typeof data !== "object") return
        const nextUrl = (data as { imageUrl?: unknown }).imageUrl
        if (typeof nextUrl === "string" && nextUrl) setImageUrl(nextUrl)
      })
      .catch(() => {
        /* keep fallback */
      })

    return () => controller.abort()
  }, [articleUrl, useXIcon])

  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-slate-800 bg-slate-900 sm:max-w-[220px]"
    >
      {useXIcon ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black px-4 text-center">
          <XLogo />
        </div>
      ) : null}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setImageUrl(null)}
        />
      ) : null}
      {!useXIcon && (!imageUrl || !loaded) ? (
        isHackerNewsSource(sourceName) ? (
          <img
            src={HACKER_NEWS_FALLBACK}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br ${brandTone(sourceName)} px-4 text-center text-slate-500`}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-cyan-300/25 bg-slate-950/45 text-base font-semibold text-cyan-200 shadow-[0_0_0_1px_rgba(103,232,249,0.08)]">
              {sourceInitial(brandLabel(sourceName))}
            </div>
            <div className="max-w-full truncate text-xs font-semibold text-slate-300">
              {brandLabel(sourceName)}
            </div>
          </div>
        )
      ) : null}
    </div>
  )
}
