import { NextRequest, NextResponse } from "next/server"
import { getNewsSourceHostnames } from "@/lib/data-news"

export const dynamic = "force-dynamic"

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "")
}

/**
 * Only raster formats are relayed. This route serves bytes from the site's own
 * origin, and an SVG is a document that can carry script: an og:image pointing
 * at a crafted SVG on any user-content host would otherwise run as
 * ai-atlas.app, with the admin's session cookie in reach.
 */
const RASTER_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
])

const MAX_REDIRECTS = 4

/**
 * Image URLs come from third-party markup and live on CDNs the news allowlist
 * does not name (x.com's images are on pbs.twimg.com, for one), so they cannot
 * be held to that list. What they can be held to is being an ordinary public
 * web address: no IP literals, nothing that names the local machine or an
 * internal zone.
 */
function isPublicWebUrl(url: URL): boolean {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false
  const host = url.hostname.toLowerCase()
  if (host === "localhost" || host.endsWith(".localhost")) return false
  if (host.endsWith(".local") || host.endsWith(".internal")) return false
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false
  if (host.startsWith("[") || host.includes(":")) return false
  return true
}

/**
 * fetch follows redirects on its own by default, which let any allowed page -
 * or any open redirect on an allowed host - send this server's request
 * anywhere. Redirects are followed by hand instead, and every hop has to pass
 * `allowHop` before it is requested.
 */
async function fetchCheckingRedirects(
  start: URL,
  init: RequestInit & { next?: { revalidate: number } },
  allowHop: (url: URL) => boolean,
): Promise<Response | null> {
  let url = start
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(url.toString(), { ...init, redirect: "manual" })
    const location = response.headers.get("location")
    if (response.status < 300 || response.status >= 400 || !location) return response
    let next: URL
    try {
      next = new URL(location, url)
    } catch {
      return null
    }
    if (!allowHop(next)) return null
    url = next
  }
  return null
}

const IMAGE_META_RE =
  /<meta[^>]*\bproperty=["'](?:og:image|twitter:image)["'][^>]*\bcontent=["']([^"']+)["'][^>]*>|<meta[^>]*\bname=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*\bcontent=["']([^"']+)["'][^>]*>|<meta[^>]*\bcontent=["']([^"']+)["'][^>]*\b(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/i

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

async function discoverImageUrl(
  pageUrl: URL,
  allowedHostnames: string[],
  signal: AbortSignal,
): Promise<string | null> {
  const youtubeImage = youtubeThumbnailUrl(pageUrl)
  if (youtubeImage) return youtubeImage

  // A page may redirect within the news sources (http to https, a moved
  // article), but not off them.
  const response = await fetchCheckingRedirects(
    pageUrl,
    {
      signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
      },
      next: { revalidate: 60 * 60 * 12 },
    },
    (next) => isPublicWebUrl(next) && allowedHostnames.includes(normalizeHostname(next.hostname)),
  )

  // Allow non-200 responses — some sites (Substack) return 404/403
  // but still serve the full page with og:image meta tags.
  if (!response || response.status < 200) return null

  const html = await response.text()
  const match = IMAGE_META_RE.exec(html)
  const rawImage = match?.[1] ?? match?.[2] ?? match?.[3] ?? ""
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

  // Only fetch pages whose hostname belongs to a published AI Atlas News
  // article — this endpoint is public, so without an allowlist it would let
  // anyone use the server to fetch and relay arbitrary URLs.
  const allowedHostnames = await getNewsSourceHostnames()
  if (!allowedHostnames.includes(normalizeHostname(pageUrl.hostname))) {
    return NextResponse.json({ imageUrl: null }, { status: 403 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4500)

  try {
    const imageUrl = await discoverImageUrl(pageUrl, allowedHostnames, controller.signal)
    if (!imageUrl) return NextResponse.json({ imageUrl: null })

    if (request.nextUrl.searchParams.get("mode") === "image") {
      const imageTarget = new URL(imageUrl)
      if (!isPublicWebUrl(imageTarget)) return new Response(null, { status: 404 })

      const imageResponse = await fetchCheckingRedirects(
        imageTarget,
        {
          signal: controller.signal,
          headers: {
            accept: "image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.9",
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
          },
          next: { revalidate: 60 * 60 * 12 },
        },
        isPublicWebUrl,
      )

      const contentType = (imageResponse?.headers.get("content-type") ?? "")
        .split(";")[0]
        .trim()
        .toLowerCase()
      if (!imageResponse || !imageResponse.ok || !RASTER_IMAGE_TYPES.has(contentType)) {
        return new Response(null, { status: 404 })
      }

      return new Response(await imageResponse.arrayBuffer(), {
        headers: {
          "Cache-Control": "public, max-age=43200, stale-while-revalidate=86400",
          "Content-Type": contentType,
          // Belt and braces for the type check above: the browser may not
          // second-guess the declared type, and nothing served here may run
          // script or load anything even if it is opened as a document.
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; sandbox",
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
