"use client"

import { useEffect, useState } from "react"
import { UseCasesTable } from "@/components/use-cases/use-cases-table"
import type { UseCaseCatalogRow } from "@/lib/types"

/**
 * Reads the table's filter/pagination state from the query string on the client
 * so that /use-cases can be prerendered.
 *
 * The page used to `await searchParams` for these, which opted the whole route
 * out of static rendering: every visit re-rendered the catalogue and cost a
 * function invocation. Nothing on this page needs the server to know the filter
 * — UseCasesTable is a client component that owns all of it.
 *
 * The first render deliberately uses the defaults, because that is what the
 * prerendered HTML contains and the two have to match or hydration fails. Once
 * mounted, if the URL actually carries parameters, the table is remounted with
 * them via `key`. That remount is what re-runs UseCasesTable's own
 * `useState(initialState.x)` initialisers — which is why this wrapper can leave
 * that component completely untouched.
 *
 * The visible cost is that a shared filtered link shows the unfiltered first
 * page for one frame before snapping to the filter. A link with no parameters —
 * the common case, and the canonical one — never remounts and never flashes.
 *
 * Rendering nothing until the query string is read would avoid the flash, but
 * the prerendered HTML would then contain no catalogue at all, which is a worse
 * trade for a page that is meant to be indexed.
 */

type InitialState = {
  q: string
  industry: string
  country: string
  validation: string
  status: string
  sort: string
  page: number
  pageSize: number
  cols: string[]
}

const DEFAULT_STATE: InitialState = {
  q: "",
  industry: "",
  country: "",
  validation: "",
  status: "",
  sort: "",
  page: 1,
  pageSize: 20,
  cols: [],
}

const PARAM_KEYS = [
  "q",
  "industry",
  "country",
  "validation",
  "status",
  "sort",
  "page",
  "pageSize",
  "cols",
  "case",
] as const

function readUrlState(search: string): {
  state: InitialState
  caseId: string | undefined
  hasAny: boolean
} {
  const params = new URLSearchParams(search)
  const get = (key: string) => params.get(key)?.trim() ?? ""
  const page = Number(get("page"))
  const pageSize = Number(get("pageSize"))

  return {
    state: {
      q: get("q"),
      industry: get("industry"),
      country: get("country"),
      validation: get("validation"),
      status: get("status"),
      sort: get("sort"),
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20,
      cols: get("cols").split(",").map((v) => v.trim()).filter(Boolean),
    },
    caseId: get("case") || undefined,
    hasAny: PARAM_KEYS.some((key) => (params.get(key)?.trim() ?? "") !== ""),
  }
}

export function UseCasesTableFromUrl({
  rows,
  latestDataUpdateCet,
}: {
  rows: UseCaseCatalogRow[]
  latestDataUpdateCet: string
}) {
  const [fromUrl, setFromUrl] = useState<{
    state: InitialState
    caseId: string | undefined
  } | null>(null)

  useEffect(() => {
    const read = readUrlState(window.location.search)
    // No parameters is the common case: leave the prerendered render in place
    // rather than remounting the whole table for nothing.
    if (!read.hasAny) return
    setFromUrl({ state: read.state, caseId: read.caseId })
  }, [])

  return (
    <UseCasesTable
      key={fromUrl ? "from-url" : "prerendered"}
      rows={rows}
      latestDataUpdateCet={latestDataUpdateCet}
      initialCaseId={fromUrl?.caseId}
      showPendingOnly={false}
      initialState={fromUrl?.state ?? DEFAULT_STATE}
    />
  )
}
