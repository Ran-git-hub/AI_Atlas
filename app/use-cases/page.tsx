import { getCachedUseCasesCatalogRows, getCachedLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import { UseCasesTable } from "@/components/use-cases/use-cases-table"
import { pageMetadata } from "@/lib/page-metadata"

// Canonical is the bare path: filter/pagination params would otherwise spawn
// endless duplicate URLs for crawlers.
export const metadata = pageMetadata({
  title: "AI Use Cases — AI Atlas",
  description:
    "Search and filter real-world AI deployments by organization, industry, and country/region.",
  path: "/use-cases",
})

type SearchParams = Record<string, string | string[] | undefined>

function getSingleParam(searchParams: SearchParams, key: string): string {
  const value = searchParams[key]
  if (Array.isArray(value)) return value[0] ?? ""
  return value ?? ""
}

export default async function UseCasesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [rows, resolvedSearchParams, latestDataUpdateCet] = await Promise.all([
    getCachedUseCasesCatalogRows(),
    searchParams,
    getCachedLatestAtlasDataUpdateCetDisplay(),
  ])

  const cols = getSingleParam(resolvedSearchParams, "cols")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  const page = Number(getSingleParam(resolvedSearchParams, "page"))
  const pageSize = Number(getSingleParam(resolvedSearchParams, "pageSize"))

  return (
    <main className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]" style={{ colorScheme: "dark" }}>
      <div className="mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <UseCasesTable
          rows={rows}
          latestDataUpdateCet={latestDataUpdateCet}
          initialCaseId={getSingleParam(resolvedSearchParams, "case") || undefined}
          showPendingOnly={false}
          initialState={{
            q: getSingleParam(resolvedSearchParams, "q"),
            industry: getSingleParam(resolvedSearchParams, "industry"),
            country: getSingleParam(resolvedSearchParams, "country"),
            validation: getSingleParam(resolvedSearchParams, "validation"),
            status: getSingleParam(resolvedSearchParams, "status"),
            sort: getSingleParam(resolvedSearchParams, "sort"),
            page: Number.isFinite(page) && page > 0 ? page : 1,
            pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20,
            cols,
          }}
        />
      </div>
    </main>
  )
}
