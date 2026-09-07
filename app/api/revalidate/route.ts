import { NextResponse, type NextRequest } from "next/server"
import { revalidateTag } from "next/cache"
import { CACHE_TAGS, CACHE_TAG_LIFE, type CacheTag } from "@/lib/cache-tags"

export const dynamic = "force-dynamic"

/**
 * Lets the daily pipeline drop caches after it writes.
 *
 * The pipeline inserts straight into Supabase, so it never passes through the
 * app and cannot call revalidateTag itself. Without this endpoint the caches
 * behind it would sit for a full day, which is the price of the 24h fallback
 * that keeps ISR writes down.
 *
 * POST /api/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *   { "tags": ["use-cases"] }        // omit to drop them all
 */
const VALID_TAGS = new Set<string>(Object.values(CACHE_TAGS))

function authorized(request: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) return false

  const header = request.headers.get("authorization") ?? ""
  const provided = header.startsWith("Bearer ") ? header.slice(7) : ""
  if (provided.length !== secret.length) return false

  // Constant-time compare so a wrong secret cannot be found byte by byte.
  let diff = 0
  for (let i = 0; i < secret.length; i += 1) {
    diff |= provided.charCodeAt(i) ^ secret.charCodeAt(i)
  }
  return diff === 0
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  let requested: string[]
  try {
    const body = (await request.json()) as { tags?: unknown }
    requested = Array.isArray(body.tags) ? body.tags.map(String) : []
  } catch {
    requested = []
  }

  const tags: CacheTag[] =
    requested.length > 0
      ? (requested.filter((tag) => VALID_TAGS.has(tag)) as CacheTag[])
      : (Object.values(CACHE_TAGS) as CacheTag[])

  if (tags.length === 0) {
    return NextResponse.json(
      { ok: false, error: "no_valid_tags", valid: [...VALID_TAGS] },
      { status: 400 },
    )
  }

  for (const tag of tags) revalidateTag(tag, CACHE_TAG_LIFE)

  return NextResponse.json({ ok: true, revalidated: tags })
}
