import { CACHE_TAGS } from "@/lib/cache-tags"
import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import type { NewsItem } from "@/lib/types-news"

const TABLE = "AI_Atlas_News" as const
/** How many published items /news carries. A chosen number, not a by-product of
  * the noise ratio - see getNewsItems. Raising it past 1000 would need paging,
  * since Supabase's REST responses stop there. */
const NEWS_LIMIT = 200
/** How far back /admin/news goes. Recent news is what gets triaged. */
const ADMIN_NEWS_LIMIT = 200

type NewsRow = {
  id: string
  company_id: string | null
  title: string
  summary: string | null
  url: string | null
  source_name: string | null
  published_at: string | null
  created_at: string | null
  tags: string[] | null
  ai_atlas_take?: string | null
  status?: string | null
}

const NEWS_SELECT =
  "id, company_id, title, summary, url, source_name, published_at, created_at, tags, ai_atlas_take, status" as const

const SOURCE_TAG_KEYS = new Set(["the decoder", "venturebeat"])

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []
  const seen = new Set<string>()
  const result: string[] = []

  for (const tag of tags) {
    const value = String(tag ?? "").trim()
    if (!value) continue
    const key = value.toLowerCase()
    if (SOURCE_TAG_KEYS.has(key)) continue
    if (seen.has(key)) continue
    seen.add(key)
    result.push(value)
  }

  return result
}

function mapNewsRow(row: NewsRow): NewsItem {
  return {
    id: row.id,
    companyId: row.company_id,
    title: row.title,
    summary: row.summary ?? "",
    url: row.url,
    sourceName: row.source_name?.trim() || "Unknown source",
    publishedAt: row.published_at,
    createdAt: row.created_at,
    tags: normalizeTags(row.tags),
    aiAtlasTake: row.ai_atlas_take?.trim() ?? "",
    status: (row.status ?? "").trim().toLowerCase() || null,
  }
}

/**
 * The newest NEWS_LIMIT published news items, newest first.
 *
 * The status filter runs in the database, not here. It used to select the
 * newest 500 rows and keep the published ones in JS, which was wrong twice
 * over. Half of what crossed the wire was discarded: of the newest 500 rows,
 * 251 are noise and 31 pending.
 *
 * And the cap applied before the filter, so how many items /news showed was a
 * side effect of how noisy the recent batches happened to be, not a number
 * anyone had chosen. The published share of a batch swings between 37% and 48%
 * month to month, which put the feed anywhere from ~184 to ~240 items. Filtering
 * first makes the limit mean what it says: the newest 200 published items,
 * always.
 *
 * id is the last sort key so the 200th place is decided the same way every
 * time, rather than arbitrarily, where two rows share a created_at and a
 * published_at.
 */
export async function getNewsItems(): Promise<NewsItem[]> {
  try {
    const supabase = createServiceRoleClient() ?? (await createClient())
    const { data, error } = await supabase
      .from(TABLE)
      .select(NEWS_SELECT)
      .eq("status", "published")
      .order("created_at", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .limit(NEWS_LIMIT)

    if (error) {
      console.error("[news] getNewsItems", error.message)
      return []
    }

    return ((data as NewsRow[] | null) ?? []).map(mapNewsRow)
  } catch (e) {
    console.error("[news] getNewsItems", e)
    return []
  }
}

export const getCachedNewsItems = unstable_cache(
  async () => getNewsItems(),
  ["news-items-v1"],
  { revalidate: 86400, tags: [CACHE_TAGS.news] },
)

/** Hostnames of published news article URLs — used to allowlist the
  * /api/news-image proxy so it can't be used to fetch arbitrary URLs. */
export async function getNewsSourceHostnames(): Promise<string[]> {
  const items = await getCachedNewsItems()
  const hostnames = new Set<string>()
  for (const item of items) {
    if (!item.url) continue
    try {
      hostnames.add(new URL(item.url).hostname.toLowerCase().replace(/^www\./, ""))
    } catch {
      // skip malformed URLs
    }
  }
  return Array.from(hostnames)
}

const NEWS_ADMIN_STATUSES = ["published", "pending", "noise"] as const

/**
 * The newest ADMIN_NEWS_LIMIT news items of any status, for triage.
 *
 * It used to ask for the whole table with no limit, which silently stopped at
 * Supabase's 1000-row cap and showed 1000 of 1206. 200 is the deliberate
 * replacement: recent news is what gets triaged.
 *
 * Note that the counts this page shows are counts of what is loaded. Items
 * older than the newest 200 are not represented in them - at the time of this
 * change that meant 56 pending rows, all older, which the page will report as
 * zero pending.
 */
export async function getAdminNewsItems(): Promise<NewsItem[]> {
  const supabase = createServiceRoleClient() ?? (await createClient())
  const { data, error } = await supabase
    .from(TABLE)
    .select(NEWS_SELECT)
    .order("created_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .limit(ADMIN_NEWS_LIMIT)

  if (error) {
    console.error("[news] getAdminNewsItems", error.message)
    return []
  }
  return (data as NewsRow[] | null)?.map(mapNewsRow) ?? []
}

/** Update the status of a single news item (admin only). */
export async function updateNewsStatus(
  id: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(NEWS_ADMIN_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: `Invalid status: ${status}` }
  }
  const supabase = createServiceRoleClient()
  if (!supabase) return { ok: false, error: "Service role not available" }
  const { error } = await supabase
    .from(TABLE)
    .update({ status })
    .eq("id", id)
  if (error) {
    console.error("[news] updateNewsStatus", error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
