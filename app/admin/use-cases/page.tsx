import { getLatestAtlasDataUpdateCetDisplay, getUseCasesCatalogRows } from "@/lib/data"
import { UseCasesTable } from "@/components/use-cases/use-cases-table"

type SearchParams = Record<string, string | string[] | undefined>

function getSingleParam(searchParams: SearchParams, key: string): string {
  const value = searchParams[key]
  if (Array.isArray(value)) return value[0] ?? ""
  return value ?? ""
}

export default async function AdminUseCasesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [rawRows, resolvedSearchParams, latestDataUpdateCet] = await Promise.all([
    getUseCasesCatalogRows({ includeArchived: true }),
    searchParams,
    getLatestAtlasDataUpdateCetDisplay(),
  ])

  // Sort pending rows to the top for SSR rendering.
  const rows = [...rawRows].sort((a, b) => {
    const aPending = a.status === "pending" ? 0 : 1
    const bPending = b.status === "pending" ? 0 : 1
    return aPending - bPending
  })

  const cols = getSingleParam(resolvedSearchParams, "cols")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  const page = Number(getSingleParam(resolvedSearchParams, "page"))
  const pageSize = Number(getSingleParam(resolvedSearchParams, "pageSize"))

  return (
    <main className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]" style={{ colorScheme: "dark" }}>
      <div className="mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-amber-300/80">
          Admin · includes archived use cases
        </p>
        <UseCasesTable
          rows={rows}
          latestDataUpdateCet={latestDataUpdateCet}
          showInsights={false}
          enableStatusChange
          showStatusColumn
          showStatusFilter
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
