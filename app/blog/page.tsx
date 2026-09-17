import { getCachedLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import { getBlogPosts } from "@/lib/data-blog"
import { BlogPostListCard } from "@/components/blog/blog-post-list-card"
import { AtlasAppTopRow } from "@/components/atlas-app-top-row"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"
import { pageMetadata } from "@/lib/page-metadata"

const blogShellPad =
  "mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]"

// ISR: the rendered page is cached for a day so crawlers hit the CDN
// instead of re-running the Supabase read. This was force-dynamic until
// getBlogPosts() stopped reaching for cookies() on the cached path - it
// uses the service-role client now, so prerendering no longer throws
// DYNAMIC_SERVER_USAGE (see lib/data-blog.ts).
//
// Two caches sit in front of this page: the route's own ISR entry, and
// the list read, tagged `blog` in lib/data-blog.ts. A post written
// straight into Supabase passes through neither, so nothing here
// notices it. Expect the staleness to be uneven rather than uniform:
// the rendered HTML is cached per edge region, so two hostnames on this
// same deployment can serve two different generations of the list -
// observed 2026-09-17, with ai-atlas.app a day behind the .vercel.app
// alias. The post's own /blog/[slug] page is unaffected, since there is
// no entry for a slug that has never been rendered, which makes the
// symptom confusing: reachable by URL, present in the sitemap, missing
// from the index. Purge the `blog` tag via /api/revalidate after
// writing a post outside the app.
export const revalidate = 86400

export const metadata = pageMetadata({
  title: "Blog — AI Atlas",
  description: "Reports and analysis on real-world AI deployments, updated regularly.",
  path: "/blog",
})

export default async function BlogPage() {
  const [posts, latestDataUpdateCet] = await Promise.all([
    getBlogPosts(),
    getCachedLatestAtlasDataUpdateCetDisplay(),
  ])

  return (
    <main
      className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]"
      style={{ colorScheme: "dark" }}
    >
      <div className="border-b border-slate-800 bg-[#121212]">
        <div className={blogShellPad}>
          <AtlasAppTopRow activeView="blog" />
          <div className="mt-4 w-full min-w-0 border-t border-slate-800/80 pt-4">
            <h1 className="mb-1 text-2xl font-bold text-[#f5f5f5]">AI Atlas Blog</h1>
            <p className="text-pretty text-sm text-slate-400">
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
