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
  const articleClasses = isWeekly
    ? {
        card: "border-slate-800 bg-[#1a1a1a] hover:border-cyan-500/40",
        meta: "text-slate-400",
        date: "text-cyan-400",
        kind: "bg-slate-800/80 text-slate-300",
        title: "text-[#f5f5f5] group-hover:text-cyan-400",
        summary: "text-slate-300",
        tag: "bg-cyan-500/10 text-cyan-300",
      }
    : {
        card: "border-slate-600/85 bg-[#3a3a3a] hover:border-cyan-200/70",
        meta: "text-slate-200",
        date: "text-cyan-200",
        kind: "bg-slate-600/85 text-white",
        title: "text-white group-hover:text-cyan-300",
        summary: "text-slate-100",
        tag: "bg-cyan-300/20 text-cyan-100",
      }

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className={`rounded-lg border px-5 py-4 transition-all ${articleClasses.card}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className={`mb-2 flex flex-wrap items-center gap-2 text-sm ${articleClasses.meta}`}>
              {isWeekly && post.weekStart && post.weekEnd ? (
                <span className={articleClasses.date}>{formatWeekRange(post.weekStart, post.weekEnd)}</span>
              ) : (
                <span className={articleClasses.date}>{formatPublished(post.publishedAt)}</span>
              )}
              <span className={`rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${articleClasses.kind}`}>
                {isWeekly ? "Weekly" : "Article"}
              </span>
            </div>

            <h3 className={`mb-2 text-xl font-semibold leading-snug transition-colors ${articleClasses.title}`}>
              {post.title}
            </h3>

            {post.summary ? <p className={`line-clamp-2 text-sm ${articleClasses.summary}`}>{post.summary}</p> : null}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {post.tags.slice(0, 4).map((tag) => (
                <span key={tag} className={`rounded px-2 py-0.5 text-xs ${articleClasses.tag}`}>
                  {tag}
                </span>
              ))}
              {post.tags.length > 4 ? (
                <span className="text-xs text-slate-400">+{post.tags.length - 4}</span>
              ) : null}
              {isWeekly ? (
                <span className="ml-auto text-xs text-slate-400">
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
