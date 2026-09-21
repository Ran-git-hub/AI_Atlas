import { getCachedUseCasesCatalogRows, getCachedLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import { UseCasesTableFromUrl } from "@/components/use-cases/use-cases-table-from-url"
import { pageMetadata } from "@/lib/page-metadata"

// Canonical is the bare path: filter/pagination params would otherwise spawn
// endless duplicate URLs for crawlers.
export const metadata = pageMetadata({
  title: "AI Use Cases — AI Atlas",
  description:
    "Search and filter real-world AI deployments by organization, industry, and country/region.",
  path: "/use-cases",
})

/**
 * Prerendered, like / and the hub pages.
 *
 * This page used to `await searchParams` to seed the table's filter and
 * pagination state. That single await opted the whole route out of static
 * rendering, so every visit re-rendered the 703-row catalogue and cost a
 * function invocation — measured at 0.71s and `x-vercel-cache: MISS` on every
 * request. None of that state needs the server: UseCasesTable is a client
 * component that owns all of it, and UseCasesTableFromUrl now reads the query
 * string in the browser.
 *
 * The timer is a backstop; the pipeline's revalidateTag on CACHE_TAGS.useCases
 * is what publishes an edit. See lib/cache-tags.ts.
 */
export const revalidate = 86400

export default async function UseCasesPage() {
  const [rows, latestDataUpdateCet] = await Promise.all([
    getCachedUseCasesCatalogRows(),
    getCachedLatestAtlasDataUpdateCetDisplay(),
  ])

  return (
    <main className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]" style={{ colorScheme: "dark" }}>
      <div className="mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <UseCasesTableFromUrl rows={rows} latestDataUpdateCet={latestDataUpdateCet} />
      </div>
    </main>
  )
}
