import Link from "next/link"
import { notFound } from "next/navigation"
import { getLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import { getAdjacentBlogPosts, getBlogPostBySlug } from "@/lib/data-blog"
import { isWeeklyBlogPost } from "@/lib/types-blog"
import { WeeklyReportContentRenderer } from "@/components/weekly-report/weekly-report-content"
import { BlogArticleBody } from "@/components/blog/blog-article-body"
import { AtlasSiteBrandStrip } from "@/components/atlas-site-brand-strip"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"

export const dynamic = "force-dynamic"

const blogShellPad =
  "mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]"

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart + "T00:00:00")
  const end = new Date(weekEnd + "T00:00:00")
  const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" }
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`
}

function formatArticleMeta(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return { title: "Post Not Found — AI Atlas" }
  return {
    title: `${post.title} — AI Atlas Blog`,
    description: post.summary || post.title,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const [{ prev, next }, latestDataUpdateCet] = await Promise.all([
    getAdjacentBlogPosts(post),
    getLatestAtlasDataUpdateCetDisplay(),
  ])
  const isWeekly = isWeeklyBlogPost(post)

  return (
    <main
      className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]"
      style={{ colorScheme: "dark" }}
    >
      <div className="border-b border-slate-800 bg-[#121212]">
        <div className={blogShellPad}>
          <AtlasSiteBrandStrip />
          <div className="mt-4 max-w-4xl border-t border-slate-800/80 pt-4">
            <Link
              href="/blog"
              className="mb-3 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400"
            >
              ← All posts
            </Link>

            {isWeekly && post.weekStart && post.weekEnd ? (
              <div className="mb-2 flex items-center gap-2 text-xs text-cyan-400">
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
              <div className="mb-2 text-xs text-cyan-400">Article · {formatArticleMeta(post.publishedAt)}</div>
            )}

            <h1 className="mb-2 text-xl font-bold text-[#f5f5f5]">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-1.5">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-400">
                  {tag}
                </span>
              ))}
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

        <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-5">
          {prev ? (
            <Link
              href={`/blog/${prev.slug}`}
              className="group flex max-w-[45%] items-center gap-2 rounded-lg border border-slate-800 bg-[#1a1a1a] px-3 py-2 text-xs transition-all hover:border-cyan-500/40"
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
              className="group flex max-w-[45%] items-center gap-2 rounded-lg border border-slate-800 bg-[#1a1a1a] px-3 py-2 text-xs transition-all hover:border-cyan-500/40"
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
