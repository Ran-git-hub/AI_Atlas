// Served to crawlers as /sitemap.xml via a rewrite in next.config.mjs.
//
// It lived at app/sitemap.xml/route.ts, and before that used Next's native
// app/sitemap.ts convention. Both kept vanishing from the Vercel build - the
// deployed output simply had no such route, so /sitemap.xml returned the
// static 404 page. Pinning the package manager, disabling middleware and
// bumping a build tag all failed to hold. A plain route handler plus a
// rewrite takes Next's metadata route resolution out of the path entirely.
import { getCachedUseCasesCatalogRows } from "@/lib/data"
import { getBlogPosts } from "@/lib/data-blog"
import { getCachedIndustrySummaries } from "@/lib/data-industries"
import { getCachedCountrySummaries } from "@/lib/data-countries"
import { absoluteUrl } from "@/lib/site-url"
import type { UseCaseCatalogRow } from "@/lib/types"
import type { BlogPostListItem } from "@/lib/types-blog"
import type { IndustrySummary } from "@/lib/data-industries"
import type { CountrySummary } from "@/lib/data-countries"

export const dynamic = "force-dynamic"
export const revalidate = 3600

function url(path: string): string {
  return absoluteUrl(path)
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
  const [useCases, industries, countries, blogPosts] = await Promise.all([
    getCachedUseCasesCatalogRows(),
    getCachedIndustrySummaries(),
    getCachedCountrySummaries(),
    getBlogPosts(),
  ])

  const entries: Array<{ loc: string; modified?: Date; priority: number; changefreq: string }> = [
    { loc: url("/"), priority: 1, changefreq: "daily" },
    { loc: url("/use-cases"), priority: 0.9, changefreq: "daily" },
    { loc: url("/industries"), priority: 0.8, changefreq: "weekly" },
    { loc: url("/countries"), priority: 0.8, changefreq: "weekly" },
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
    ...(countries as CountrySummary[]).map((item) => ({
      loc: url(`/countries/${encodeURIComponent(item.slug)}`),
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
