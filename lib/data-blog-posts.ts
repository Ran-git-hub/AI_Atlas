import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from "./config"

const headers = {
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  apikey: SUPABASE_SERVICE_KEY,
  "Content-Type": "application/json",
  Prefer: "return=representation",
}

export interface BlogPost {
  id: string
  post_kind: string
  slug: string
  title: string
  summary: string
  content: Record<string, unknown>
  tags: string[]
  related_case_ids: string[]
  week_start: string
  week_end: string
  new_use_cases_count: number
  new_companies_count: number
  countries_count: number
  industries_count: number
  data_sources: string
  published_at: string
  created_at: string
  updated_at: string
}

export interface BlogPostListItem {
  id: string
  slug: string
  title: string
  summary: string
  tags: string[]
  week_start: string
  week_end: string
  new_use_cases_count: number
  published_at: string
}

export async function getBlogPosts(): Promise<BlogPostListItem[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/AI_Atlas_Blog_Posts?select=id,slug,title,summary,tags,week_start,week_end,new_use_cases_count,published_at&order=week_start.desc`,
    { headers }
  )
  if (!res.ok) throw new Error(`Failed to fetch blog posts: ${res.status}`)
  return res.json()
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/AI_Atlas_Blog_Posts?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
    { headers }
  )
  if (!res.ok) throw new Error(`Failed to fetch blog post: ${res.status}`)
  const posts: BlogPost[] = await res.json()
  return posts[0] || null
}

export async function getAdjacentBlogPosts(
  weekStart: string
): Promise<{ prev: BlogPostListItem | null; next: BlogPostListItem | null }> {
  const [prevRes, nextRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/AI_Atlas_Blog_Posts?week_start=lt.${weekStart}&select=id,slug,title,summary,tags,week_start,week_end,new_use_cases_count,published_at&order=week_start.desc&limit=1`,
      { headers }
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/AI_Atlas_Blog_Posts?week_start=gt.${weekStart}&select=id,slug,title,summary,tags,week_start,week_end,new_use_cases_count,published_at&order=week_start.asc&limit=1`,
      { headers }
    ),
  ])

  const prev: BlogPostListItem[] = prevRes.ok ? await prevRes.json() : []
  const next: BlogPostListItem[] = nextRes.ok ? await nextRes.json() : []

  return {
    prev: prev[0] || null,
    next: next[0] || null,
  }
}

export async function createBlogPost(input: Omit<BlogPost, "id" | "created_at" | "updated_at">): Promise<BlogPost> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/AI_Atlas_Blog_Posts`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...input,
      published_at: input.published_at || new Date().toISOString(),
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to create blog post: ${res.status} — ${err}`)
  }
  const posts: BlogPost[] = await res.json()
  return posts[0]
}
