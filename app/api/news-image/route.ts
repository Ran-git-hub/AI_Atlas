import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const IMAGE_META_RE =
  /<meta\s+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["']\s+content=["']([^"']+)["'][^>]*>|<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/i

function youtubeThumbnailUrl(pageUrl: URL): string | null {
  const hostname = pageUrl.hostname.replace(/^www\./, "").replace(/^m\./, "")
  let videoId = ""

  if (hostname === "youtu.be") {
    videoId = pageUrl.pathname.split("/").filter(Boolean)[0] ?? ""
  } else if (hostname === "youtube.com" || hostname === "youtube-nocookie.com") {
    videoId = pageUrl.searchParams.get("v")?.trim() ?? ""
    if (!videoId) {
      const [section, id] = pageUrl.pathname.split("/").filter(Boolean)
      if (section === "shorts" || section === "embed" || section === "live") videoId = id ?? ""
    }
  }

  if (!/^[a-zA-Z0-9_-]{6,}$/.test(videoId)) return null
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

function normalizeImageUrl(raw: string, pageUrl: string): string | null {
  const value = raw
    .trim()
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/g, "/")
    .replace(/&#47;/g, "/")
  if (!value) return null

  try {
    const parsed = new URL(value, pageUrl)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
    return parsed.toString()
  } catch {
    return null
  }
}

async function discoverImageUrl(pageUrl: URL, signal: AbortSignal): Promise<string | null> {
  const youtubeImage = youtubeThumbnailUrl(pageUrl)
  if (youtubeImage) return youtubeImage

  const response = await fetch(pageUrl.toString(), {
    signal,
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
    },
    next: { revalidate: 60 * 60 * 12 },
  })

  if (!response.ok) return null

  const html = await response.text()
  const match = IMAGE_META_RE.exec(html)
  const rawImage = match?.[1] ?? match?.[2] ?? ""
  return normalizeImageUrl(rawImage, pageUrl.toString())
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim()
  if (!url) {
    return NextResponse.json({ imageUrl: null }, { status: 400 })
  }

  let pageUrl: URL
  try {
    pageUrl = new URL(url)
  } catch {
    return NextResponse.json({ imageUrl: null }, { status: 400 })
  }

  if (pageUrl.protocol !== "http:" && pageUrl.protocol !== "https:") {
    return NextResponse.json({ imageUrl: null }, { status: 400 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4500)

  try {
    const imageUrl = await discoverImageUrl(pageUrl, controller.signal)
    if (!imageUrl) return NextResponse.json({ imageUrl: null })

    if (request.nextUrl.searchParams.get("mode") === "image") {
      const imageResponse = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        },
        next: { revalidate: 60 * 60 * 12 },
      })

      const contentType = imageResponse.headers.get("content-type") ?? ""
      if (!imageResponse.ok || !contentType.startsWith("image/")) {
        return new Response(null, { status: 404 })
      }

      return new Response(await imageResponse.arrayBuffer(), {
        headers: {
          "Cache-Control": "public, max-age=43200, stale-while-revalidate=86400",
          "Content-Type": contentType,
        },
      })
    }

    const proxiedImageUrl = new URL(request.nextUrl)
    proxiedImageUrl.searchParams.set("mode", "image")

    return NextResponse.json(
      { imageUrl: `${proxiedImageUrl.pathname}?${proxiedImageUrl.searchParams.toString()}` },
      {
        headers: {
          "Cache-Control": "public, max-age=43200, stale-while-revalidate=86400",
        },
      },
    )
  } catch {
    return NextResponse.json({ imageUrl: null })
  } finally {
    clearTimeout(timeout)
  }
}
