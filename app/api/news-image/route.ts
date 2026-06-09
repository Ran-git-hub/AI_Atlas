import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const IMAGE_META_RE =
  /<meta\s+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["']\s+content=["']([^"']+)["'][^>]*>|<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/i

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
    const response = await fetch(pageUrl.toString(), {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
      },
      next: { revalidate: 60 * 60 * 12 },
    })

    if (!response.ok) {
      return NextResponse.json({ imageUrl: null })
    }

    const html = await response.text()
    const match = IMAGE_META_RE.exec(html)
    const rawImage = match?.[1] ?? match?.[2] ?? ""
    const imageUrl = normalizeImageUrl(rawImage, pageUrl.toString())

    return NextResponse.json(
      { imageUrl },
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
