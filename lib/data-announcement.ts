import { unstable_cache } from "next/cache"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { createClient } from "@/lib/supabase/server"
import { CACHE_TAGS } from "@/lib/cache-tags"

const TABLE = "AI_Atlas_Announcements" as const
const ROW_ID = 1

type AnnouncementRow = {
  id: number
  content: string | null
  updated_at: string | null
}

export async function getAnnouncementContent(): Promise<string> {
  try {
    const supabase = createServiceRoleClient() ?? (await createClient())
    const { data, error } = await supabase
      .from(TABLE)
      .select("content")
      .eq("id", ROW_ID)
      .maybeSingle()

    if (error) {
      console.error("[announcement] getAnnouncementContent", error.message)
      return ""
    }
    return ((data as Pick<AnnouncementRow, "content"> | null)?.content ?? "").trim()
  } catch (e) {
    console.error("[announcement] getAnnouncementContent", e)
    return ""
  }
}

/**
 * The announcement bar sits in the root layout, so this is read once per page
 * load across the whole site - it was the busiest query on the project. It
 * changes a handful of times a month, and updateAnnouncementContent purges the
 * tag, so the timer is only a backstop for a row edited straight in Supabase.
 */
export const getCachedAnnouncementContent = unstable_cache(
  async () => getAnnouncementContent(),
  ["announcement-v1"],
  { revalidate: 86400, tags: [CACHE_TAGS.announcement] },
)

export async function updateAnnouncementContent(
  content: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServiceRoleClient()
  if (!supabase) return { ok: false, error: "Service role not available" }

  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: ROW_ID, content: content.trim() }, { onConflict: "id" })

  if (error) {
    console.error("[announcement] updateAnnouncementContent", error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
