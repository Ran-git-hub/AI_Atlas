import { getUseCasesCatalogRows } from "@/lib/data"
import { UseCasesTable } from "@/components/use-cases/use-cases-table"

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
  const [rows, resolvedSearchParams] = await Promise.all([
    getUseCasesCatalogRows(),
    searchParams,
  ])

  const cols = getSingleParam(resolvedSearchParams, "cols")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  const page = Number(getSingleParam(resolvedSearchParams, "page"))
  const pageSize = Number(getSingleParam(resolvedSearchParams, "pageSize"))

  return (
    <main className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]" style={{ colorScheme: "dark" }}>
      <div className="mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-8">
        <UseCasesTable
          rows={rows}
          initialState={{
            q: getSingleParam(resolvedSearchParams, "q"),
            industry: getSingleParam(resolvedSearchParams, "industry"),
            country: getSingleParam(resolvedSearchParams, "country"),
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
