import { getCachedUseCasesCatalogRows } from "@/lib/data"
import { getBlogPosts } from "@/lib/data-blog"
import { getCachedIndustrySummaries } from "@/lib/data-industries"
import type { UseCaseCatalogRow } from "@/lib/types"
import type { BlogPostListItem } from "@/lib/types-blog"
import type { IndustrySummary } from "@/lib/data-industries"

// Bump this to force Vercel to invalidate the stale build cache for
// this route. The previous deploy was restoring a cached .vercel/output
// that didn't include sitemap.xml. If you change the route logic, also
// bump this. Last bumped: 2026-07-02 v4 (force fresh build).
const SITEMAP_BUILD_TAG = "v4"

export const dynamic = "force-dynamic"
export const revalidate = 3600

const FALLBACK_SITE_URL = "https://ai-atlas.app"

function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    FALLBACK_SITE_URL
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return withProtocol.replace(/\/+$/, "")
}

function url(path: string): string {
  return `${siteUrl()}${path}`
}

function lastModified(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function renderUrl(loc: string, modified: Date | undefined, priority: number, changefreq: string): string {
  const lines = [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
  ]
  if (modified) {
    lines.push(`    <lastmod>${modified.toISOString()}</lastmod>`)
  }
  lines.push(`    <changefreq>${changefreq}</changefreq>`)
  lines.push(`    <priority>${priority.toFixed(1)}</priority>`)
  lines.push("  </url>")
  return lines.join("\n")
}

function renderSitemapXml(entries: Array<{ loc: string; modified?: Date; priority: number; changefreq: string }>): string {
  const body = entries.map((e) => renderUrl(e.loc, e.modified, e.priority, e.changefreq)).join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`
}

export async function GET(): Promise<Response> {
  const [useCases, industries, blogPosts] = await Promise.all([
    getCachedUseCasesCatalogRows(),
    getCachedIndustrySummaries(),
    getBlogPosts(),
  ])

  // Use the build tag in a no-op to ensure the file's mtime changes
  // (helps invalidate stale caches on Vercel when the file is unchanged
  // in content but rebuilt due to other changes).
  void SITEMAP_BUILD_TAG

  const entries: Array<{ loc: string; modified?: Date; priority: number; changefreq: string }> = [
    { loc: url("/"), priority: 1, changefreq: "daily" },
    { loc: url("/use-cases"), priority: 0.9, changefreq: "daily" },
    { loc: url("/industries"), priority: 0.8, changefreq: "weekly" },
    { loc: url("/news"), priority: 0.8, changefreq: "daily" },
    { loc: url("/blog"), priority: 0.7, changefreq: "weekly" },
    { loc: url("/quality"), priority: 0.4, changefreq: "weekly" },
    ...(useCases as UseCaseCatalogRow[]).map((item) => ({
      loc: url(`/use-cases/${encodeURIComponent(item.id)}`),
      modified: lastModified(item.updated_at || item.created_at),
      changefreq: "weekly",
      priority: 0.7,
    })),
    ...(industries as IndustrySummary[]).map((item) => ({
      loc: url(`/industries/${encodeURIComponent(item.slug)}`),
      modified: lastModified(item.latestUpdatedAt),
      changefreq: "weekly",
      priority: 0.7,
    })),
    ...(blogPosts as BlogPostListItem[]).map((post) => ({
      loc: url(`/blog/${encodeURIComponent(post.slug)}`),
      modified: lastModified(post.publishedAt),
      changefreq: "monthly",
      priority: 0.6,
    })),
  ]

  const xml = renderSitemapXml(entries)
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
