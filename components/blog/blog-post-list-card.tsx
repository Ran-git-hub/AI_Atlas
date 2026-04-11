"use client"

import Link from "next/link"
import type { BlogPostListItem } from "@/lib/types-blog"

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart + "T00:00:00")
  const end = new Date(weekEnd + "T00:00:00")
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`
}

function formatPublished(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function BlogPostListCard({ post }: { post: BlogPostListItem }) {
  const isWeekly = post.postKind === "weekly_report"

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="rounded-lg border border-slate-800 bg-[#1a1a1a] px-4 py-3 transition-all hover:border-cyan-500/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {isWeekly && post.weekStart && post.weekEnd ? (
                <span className="text-cyan-400">{formatWeekRange(post.weekStart, post.weekEnd)}</span>
              ) : (
                <span className="text-cyan-400">{formatPublished(post.publishedAt)}</span>
              )}
              <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                {isWeekly ? "Weekly" : "Article"}
              </span>
            </div>

            <h3 className="mb-1 text-sm font-semibold text-[#f5f5f5] transition-colors group-hover:text-cyan-400">
              {post.title}
            </h3>

            {post.summary ? <p className="line-clamp-1 text-xs text-slate-400">{post.summary}</p> : null}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {post.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-400">
                  {tag}
                </span>
              ))}
              {post.tags.length > 4 ? (
                <span className="text-[10px] text-slate-500">+{post.tags.length - 4}</span>
              ) : null}
              {isWeekly ? (
                <span className="ml-auto text-[10px] text-slate-500">
                  <span className="text-cyan-400">{post.newUseCasesCount}</span> cases
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
