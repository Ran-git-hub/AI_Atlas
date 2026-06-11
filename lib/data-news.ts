import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import type { NewsItem } from "@/lib/types-news"

const TABLE = "AI_Atlas_News" as const

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
  Status?: string | null
}

const NEWS_SELECT =
  "id, company_id, title, summary, url, source_name, published_at, created_at, tags" as const
const NEWS_SELECT_WITH_TAKE =
  "id, company_id, title, summary, url, source_name, published_at, created_at, tags, ai_atlas_take" as const
const NEWS_SELECT_WITH_TAKE_AND_STATUS =
  "id, company_id, title, summary, url, source_name, published_at, created_at, tags, ai_atlas_take, status" as const
const NEWS_SELECT_WITH_TAKE_AND_STATUS_TITLE =
  'id, company_id, title, summary, url, source_name, published_at, created_at, tags, ai_atlas_take, "Status"' as const

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
  }
}

function isVisibleNewsRow(row: NewsRow): boolean {
  const status = (row.status ?? row.Status ?? "").trim().toLowerCase()
  return status !== "nosie" && status !== "noise"
}

export async function getNewsItems(limit = 60): Promise<NewsItem[]> {
  try {
    const supabase = createServiceRoleClient() ?? (await createClient())
    let result = await supabase
      .from(TABLE)
      .select(NEWS_SELECT_WITH_TAKE_AND_STATUS)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(limit)

    if (result.error && result.error.message.includes("status")) {
      result = await supabase
        .from(TABLE)
        .select(NEWS_SELECT_WITH_TAKE_AND_STATUS_TITLE)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false, nullsFirst: false })
        .limit(limit)
    }

    if (result.error && result.error.message.toLowerCase().includes("status")) {
      result = await supabase
        .from(TABLE)
        .select(NEWS_SELECT_WITH_TAKE)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false, nullsFirst: false })
        .limit(limit)
    }

    if (result.error && result.error.message.includes("ai_atlas_take")) {
      result = await supabase
        .from(TABLE)
        .select(NEWS_SELECT)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false, nullsFirst: false })
        .limit(limit)
    }

    if (result.error) {
      console.error("[news] getNewsItems", result.error.message)
      return []
    }

    return ((result.data as NewsRow[] | null) ?? []).filter(isVisibleNewsRow).map(mapNewsRow)
  } catch (e) {
    console.error("[news] getNewsItems", e)
    return []
  }
}
