import { getLatestAtlasDataUpdateCetDisplay, getUseCasesCatalogRows } from "@/lib/data"
import { getNewsItems } from "@/lib/data-news"
import { useCaseDisplayName } from "@/lib/types"
import type { NewsItem, NewsTakeContext } from "@/lib/types-news"
import { AtlasAppTopRow } from "@/components/atlas-app-top-row"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"
import { NewsFeed } from "@/components/news/news-feed"
import { NewsSourcesButton } from "@/components/news/news-sources-dialog"
import { BuildersButton } from "@/components/news/builders-dialog"

const newsShellPad =
  "mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]"

export const metadata = {
  title: "AI News — AI Atlas",
  description:
    "AI Atlas curates AI industry updates from leading media and builder channels, then connects them with published use cases for editorial context.",
}

export const dynamic = "force-dynamic"

function isPublishedStatus(status: string | null | undefined): boolean {
  return status?.trim().toLowerCase() === "published"
}

function buildTakeContext(items: NewsItem[], useCases: Awaited<ReturnType<typeof getUseCasesCatalogRows>>): NewsTakeContext {
  return {
    useCases: useCases
      .filter((row) => isPublishedStatus(row.status))
      .map((row) => ({
        id: row.id,
        title: useCaseDisplayName(row),
        companyName: row.company_name?.trim() || "Unknown organization",
        industry: row.industry?.trim() || row.sector?.trim() || "Uncategorized",
        description: row.description?.trim() || "",
      })),
    news: items.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      sourceName: item.sourceName,
      tags: item.tags,
    })),
  }
}

export default async function NewsPage() {
  const [items, useCases, latestDataUpdateCet] = await Promise.all([
    getNewsItems(),
    getUseCasesCatalogRows(),
    getLatestAtlasDataUpdateCetDisplay(),
  ])
  const publishedUseCases = useCases.filter((row) => isPublishedStatus(row.status))
  const takeContext = buildTakeContext(items, useCases)

  return (
    <main
      className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]"
      style={{ colorScheme: "dark" }}
    >
      <div className="border-b border-slate-800 bg-[#121212]">
        <div className={newsShellPad}>
          <AtlasAppTopRow activeView="news" />
          <div className="mt-4 w-full min-w-0 border-t border-slate-800/80 pt-4">
            <h1 className="mb-1 text-2xl font-bold text-[#f5f5f5]">AI News</h1>
            <p className="text-pretty text-sm text-slate-400">
              AI Atlas curates AI industry updates from{" "}
              <NewsSourcesButton />{" "}
              and{" "}
              <BuildersButton />{" "}
              , then connects them with
              published use cases for editorial context. Summaries are AI-assisted digests. Read the original source for
              full context.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        <NewsFeed items={items} takeContext={takeContext} useCaseRows={publishedUseCases} />
      </div>

      <div className="mx-auto mt-8 max-w-7xl px-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
        <AtlasSiteFooter latestDataUpdateCet={latestDataUpdateCet} layout="inline" />
      </div>
    </main>
  )
}
