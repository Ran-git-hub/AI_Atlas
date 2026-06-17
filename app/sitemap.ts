import type { MetadataRoute } from "next"
import { getUseCasesCatalogRows } from "@/lib/data"
import { getBlogPosts } from "@/lib/data-blog"
import { getIndustrySummaries } from "@/lib/data-industries"

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [useCases, industries, blogPosts] = await Promise.all([
    getUseCasesCatalogRows(),
    getIndustrySummaries(),
    getBlogPosts(),
  ])

  return [
    {
      url: url("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: url("/use-cases"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: url("/industries"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: url("/news"),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: url("/blog"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: url("/quality"),
      changeFrequency: "weekly",
      priority: 0.4,
    },
    ...useCases.map((item) => ({
      url: url(`/use-cases/${encodeURIComponent(item.id)}`),
      lastModified: lastModified(item.updated_at || item.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...industries.map((item) => ({
      url: url(`/industries/${encodeURIComponent(item.slug)}`),
      lastModified: lastModified(item.latestUpdatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...blogPosts.map((post) => ({
      url: url(`/blog/${encodeURIComponent(post.slug)}`),
      lastModified: lastModified(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ]
}
