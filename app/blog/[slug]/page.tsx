import Link from "next/link"
import { notFound } from "next/navigation"
import { getCachedLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import { getAdjacentBlogPosts, getBlogPostBySlug } from "@/lib/data-blog"
import { isWeeklyBlogPost } from "@/lib/types-blog"
import { WeeklyReportContentRenderer } from "@/components/weekly-report/weekly-report-content"
import { BlogArticleBody } from "@/components/blog/blog-article-body"
import { AtlasAppTopRow } from "@/components/atlas-app-top-row"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"
import { ShareRow } from "@/components/share-row"
import { pageMetadata } from "@/lib/page-metadata"
import { absoluteUrl } from "@/lib/site-url"

import { formatAtlasDate, formatAtlasDateRange } from "@/lib/format-date"
export const revalidate = 600

const blogShellPad =
  "mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]"

function formatWeekRange(weekStart: string, weekEnd: string): string {
  return formatAtlasDateRange(`${weekStart}T00:00:00`, `${weekEnd}T00:00:00`)
}

function formatArticleMeta(iso: string): string {
  return formatAtlasDate(iso)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return { title: "Post Not Found — AI Atlas" }
  return pageMetadata({
    title: `${post.title} — AI Atlas Blog`,
    description: post.summary || post.title,
    path: `/blog/${encodeURIComponent(slug)}`,
    type: "article",
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const [{ prev, next }, latestDataUpdateCet] = await Promise.all([
    getAdjacentBlogPosts(post),
    getCachedLatestAtlasDataUpdateCetDisplay(),
  ])
  const isWeekly = isWeeklyBlogPost(post)
  const postUrl = absoluteUrl(`/blog/${encodeURIComponent(post.slug)}`)
  const shareMeta = [
    isWeekly ? "Weekly report" : "Article",
    isWeekly && post.weekStart && post.weekEnd
      ? formatWeekRange(post.weekStart, post.weekEnd)
      : formatArticleMeta(post.publishedAt),
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <main
      className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]"
      style={{ colorScheme: "dark" }}
    >
      <div className="border-b border-slate-800 bg-[#121212]">
        <div className={blogShellPad}>
          <AtlasAppTopRow activeView="blog" />
          <div className="mt-4 w-full min-w-0 border-t border-slate-800/80 pt-4">
            <Link
              href="/blog"
              className="mb-5 inline-flex items-center gap-2 rounded-md border border-cyan-500/35 bg-cyan-500/10 px-3.5 py-1.5 text-sm font-medium text-cyan-300 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/15 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]"
            >
              ← All posts
            </Link>

            {isWeekly && post.weekStart && post.weekEnd ? (
              <div className="mb-3 flex items-center gap-2 text-sm text-cyan-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {formatWeekRange(post.weekStart, post.weekEnd)}
              </div>
            ) : (
              <div className="mb-3 text-sm text-cyan-400">Article · {formatArticleMeta(post.publishedAt)}</div>
            )}

            <h1 className="mb-3 text-pretty text-3xl font-bold leading-tight text-[#f5f5f5] md:text-4xl">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-5 border-t border-slate-800/80 pt-4">
              <ShareRow
                url={postUrl}
                title={post.title}
                description={post.summary}
                meta={shareMeta}
                emailSubject={`AI Atlas: ${post.title}`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-5 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        {isWeekly ? (
          <WeeklyReportContentRenderer content={post.content} relatedCaseIds={post.relatedCaseIds} />
        ) : (
          <BlogArticleBody content={post.content} />
        )}

        <div className="mt-10 flex items-center justify-between border-t border-slate-800 pt-6">
          {prev ? (
            <Link
              href={`/blog/${prev.slug}`}
              className="group flex max-w-[45%] items-center gap-2 rounded-lg border border-slate-800 bg-[#1a1a1a] px-3.5 py-2.5 text-sm transition-all hover:border-cyan-500/40"
            >
              <svg
                className="h-3 w-3 shrink-0 text-slate-400 transition-colors group-hover:text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="truncate text-slate-300 transition-colors group-hover:text-cyan-400">
                {prev.title}
              </span>
            </Link>
          ) : (
            <div />
          )}

          {next ? (
            <Link
              href={`/blog/${next.slug}`}
              className="group flex max-w-[45%] items-center gap-2 rounded-lg border border-slate-800 bg-[#1a1a1a] px-3.5 py-2.5 text-sm transition-all hover:border-cyan-500/40"
            >
              <span className="truncate text-slate-300 transition-colors group-hover:text-cyan-400">
                {next.title}
              </span>
              <svg
                className="h-3 w-3 shrink-0 text-slate-400 transition-colors group-hover:text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-7xl px-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        <AtlasSiteFooter latestDataUpdateCet={latestDataUpdateCet} layout="inline" />
      </div>
    </main>
  )
}
