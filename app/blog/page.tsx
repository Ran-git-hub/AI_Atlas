import { getLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import { getBlogPosts } from "@/lib/data-blog"
import { BlogPostListCard } from "@/components/blog/blog-post-list-card"
import { AtlasSiteBrandStrip } from "@/components/atlas-site-brand-strip"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"

const blogShellPad =
  "mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]"

export const metadata = {
  title: "Blog — AI Atlas",
  description: "Reports and analysis on real-world AI deployments, updated regularly.",
}

export default async function BlogPage() {
  const [posts, latestDataUpdateCet] = await Promise.all([
    getBlogPosts(),
    getLatestAtlasDataUpdateCetDisplay(),
  ])

  return (
    <main
      className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]"
      style={{ colorScheme: "dark" }}
    >
      <div className="border-b border-slate-800 bg-[#121212]">
        <div className={blogShellPad}>
          <AtlasSiteBrandStrip />
          <div className="mt-4 max-w-4xl border-t border-slate-800/80 pt-4">
            <h1 className="mb-1 text-2xl font-bold text-[#f5f5f5]">AI Atlas Blog</h1>
            <p className="text-sm text-slate-400">
              Reports and analysis on real-world AI deployments, updated regularly.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 text-slate-600">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <h2 className="mb-1 text-lg font-semibold text-[#f5f5f5]">No posts yet</h2>
            <p className="max-w-sm text-xs text-slate-400">
              Posts will appear here once they are published to the database.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <BlogPostListCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto mt-8 max-w-7xl px-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        <AtlasSiteFooter latestDataUpdateCet={latestDataUpdateCet} layout="inline" />
      </div>
    </main>
  )
}
