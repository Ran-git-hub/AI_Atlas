import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { updateAnnouncementContent } from "@/lib/data-announcement"
import { CACHE_TAGS, CACHE_TAG_LIFE } from "@/lib/cache-tags"

export async function PATCH(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const content = typeof body.content === "string" ? body.content : ""
  const result = await updateAnnouncementContent(content)
  // GET /api/announcement is cached now, so without this a saved announcement
  // would wait out the 24h backstop before the site showed it.
  if (result.ok) revalidateTag(CACHE_TAGS.announcement, CACHE_TAG_LIFE)
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
