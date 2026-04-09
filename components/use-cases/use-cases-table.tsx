"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  Building2,
  Calendar,
  CircleHelp,
  Columns3,
  ExternalLink,
  Factory,
  Filter,
  Globe,
  Hash,
  MapPin,
  X,
} from "lucide-react"
import type { UseCaseCatalogRow } from "@/lib/types"
import { useCaseDisplayName } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createPortal } from "react-dom"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AdvancedFilterDateField } from "@/components/use-cases/advanced-filter-date-field"
import { AtlasSiteFooter } from "@/components/atlas-site-footer"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/hooks/use-toast"

type InitialState = {
  q: string
  industry: string
  country: string
  sort: string
  page: number
  pageSize: number
  cols: string[]
}

interface UseCasesTableProps {
  rows: UseCaseCatalogRow[]
  initialState: InitialState
  latestDataUpdateCet: string
}

type TableDensity = "compact" | "comfortable"

const MAX_RECENT_FILTER_PICKS = 5
const RECENT_INDUSTRIES_KEY = "use-cases:recent-filter-industries:v1"
const RECENT_COUNTRIES_KEY = "use-cases:recent-filter-countries:v1"
const TABLE_DENSITY_STORAGE_KEY = "use-cases:table-density:v1"

function loadRecentFilterPicks(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map((v) => String(v)).filter(Boolean).slice(0, MAX_RECENT_FILTER_PICKS)
  } catch {
    return []
  }
}

function persistRecentFilterPicks(key: string, values: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(values.slice(0, MAX_RECENT_FILTER_PICKS)))
  } catch {
    // Ignore storage write failures.
  }
}

function bumpRecentPick(prev: string[], value: string): string[] {
  const v = value.trim()
  if (!v) return prev
  return [v, ...prev.filter((x) => x !== v)].slice(0, MAX_RECENT_FILTER_PICKS)
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d)
}

/** Same 24h window as globe search / detail panel for use cases. */
function isUseCaseCatalogRowRecent24h(row: UseCaseCatalogRow): boolean {
  const ts = Date.parse(row.updated_at ?? row.created_at ?? "")
  return Number.isFinite(ts) && Date.now() - ts <= 24 * 60 * 60 * 1000
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const v = value?.trim()
    if (v) return v
  }
  return "—"
}

function isProbablyUrl(_key: string, value: string): boolean {
  const v = value.trim()
  if (!/^https?:\/\//i.test(v)) return false
  if (v.includes("\n")) return false
  return true
}

/** Default hidden when no `cols` query; order matches table columns for URL sync. */
const DEFAULT_HIDDEN_COLUMN_IDS = new Set<string>(["city", "source"])

const ALL_COLUMN_IDS = [
  "title",
  "updated_at",
  "company",
  "industry",
  "country",
  "city",
  "source",
] as const

function sortColumnLabel(columnId: string): string {
  const labels: Record<string, string> = {
    title: "Use Case",
    updated_at: "Updated",
    company: "Organization",
    industry: "Industry",
    country: "Country",
    city: "City",
    source: "Source",
  }
  return labels[columnId] ?? columnId.replaceAll("_", " ")
}

function KpiStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="flex min-h-[3.25rem] cursor-default flex-col justify-center gap-1 rounded-xl border border-cyan-500/15 bg-slate-950/40 px-3 py-2.5 text-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] select-none md:min-h-0 md:flex-row md:items-center md:gap-1.5 md:rounded-sm md:border-0 md:border-l md:border-white/20 md:bg-transparent md:px-2 md:py-0.5 md:shadow-none">
      <div className="flex items-center gap-1.5 text-[#7f8a85]">
        {icon}
        <span className="font-medium tracking-wide">{label}</span>
      </div>
      <span className="truncate text-[13px] font-semibold tabular-nums text-[#e8eeeb] md:text-xs md:font-medium md:text-[#d7dedb]">
        {value}
      </span>
    </div>
  )
}

function AtlasLogoMark() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-slate-800/80 backdrop-blur-sm md:h-9 md:w-9">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5 text-cyan-400 md:h-6 md:w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="8.4" />
        <path d="M7.3 8.4 13 6.8 16.7 14.8 7.3 8.4Z" />
        <circle cx="7.3" cy="8.4" r="0.9" />
        <circle cx="13" cy="6.8" r="0.9" />
        <circle cx="16.7" cy="14.8" r="0.9" />
      </svg>
    </div>
  )
}

export function UseCasesTable({ rows, initialState, latestDataUpdateCet }: UseCasesTableProps) {
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    const root = document.documentElement
    const hadDark = root.classList.contains("dark")
    if (!hadDark) {
      root.classList.add("dark")
    }
    return () => {
      if (!hadDark) {
        root.classList.remove("dark")
      }
    }
  }, [])

  const [searchInput, setSearchInput] = React.useState(initialState.q)
  const [globalFilter, setGlobalFilter] = React.useState(initialState.q)
  const [industryFilter, setIndustryFilter] = React.useState<string[]>(
    initialState.industry
      ? initialState.industry.split(",").map((v) => v.trim()).filter(Boolean)
      : []
  )
  const [countryFilter, setCountryFilter] = React.useState<string[]>(
    initialState.country
      ? initialState.country.split(",").map((v) => v.trim()).filter(Boolean)
      : []
  )
  const [cityFilter, setCityFilter] = React.useState("")
  const [orgFilter, setOrgFilter] = React.useState("")
  const [dateAfter, setDateAfter] = React.useState("")
  const [dateBefore, setDateBefore] = React.useState("")
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const [tableDensity, setTableDensity] = React.useState<TableDensity>("comfortable")
  const [recentIndustryPicks, setRecentIndustryPicks] = React.useState<string[]>([])
  const [recentCountryPicks, setRecentCountryPicks] = React.useState<string[]>([])
  const lastActionToastRef = React.useRef<{ text: string; at: number }>({ text: "", at: 0 })

  const notifyAction = React.useCallback((text: string) => {
    const now = Date.now()
    if (lastActionToastRef.current.text === text && now - lastActionToastRef.current.at < 900) {
      return
    }
    lastActionToastRef.current = { text, at: now }
    toast({
      description: text,
      duration: 1300,
    })
  }, [])

  const setTableDensityPersist = React.useCallback((next: TableDensity) => {
    setTableDensity(next)
    try {
      window.localStorage.setItem(TABLE_DENSITY_STORAGE_KEY, next)
    } catch {
      // Ignore storage write failures.
    }
    notifyAction(next === "compact" ? "Density set to Compact." : "Density set to Comfortable.")
  }, [notifyAction])
  const [sorting, setSorting] = React.useState<SortingState>(() => {
    const [id, dir] = initialState.sort.split(":")
    if (!id) return [{ id: "updated_at", desc: true }]
    return [{ id, desc: dir === "desc" }]
  })
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() =>
    Object.fromEntries(
      ALL_COLUMN_IDS.map((id) => [
        id,
        initialState.cols.length
          ? initialState.cols.includes(id)
          : !DEFAULT_HIDDEN_COLUMN_IDS.has(id),
      ])
    )
  )
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []
    if (initialState.industry) filters.push({ id: "industry", value: initialState.industry })
    if (initialState.country) filters.push({ id: "country", value: initialState.country })
    return filters
  })
  const [pagination, setPagination] = React.useState({
    pageIndex: Math.max(initialState.page - 1, 0),
    pageSize: initialState.pageSize,
  })
  const [pageJumpInput, setPageJumpInput] = React.useState(String(Math.max(initialState.page, 1)))
  const [activeDetail, setActiveDetail] = React.useState<UseCaseCatalogRow | null>(null)

  const openDetail = React.useCallback((row: UseCaseCatalogRow) => {
    setActiveDetail(row)
  }, [])

  const [viewportWidth, setViewportWidth] = React.useState(1024)
  React.useLayoutEffect(() => {
    const update = () => setViewportWidth(window.innerWidth)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  React.useLayoutEffect(() => {
    try {
      const raw = window.localStorage.getItem(TABLE_DENSITY_STORAGE_KEY)
      if (raw === "compact" || raw === "comfortable") {
        setTableDensity(raw)
        return
      }
      setTableDensity(window.innerWidth < 768 ? "compact" : "comfortable")
    } catch {
      setTableDensity(window.innerWidth < 768 ? "compact" : "comfortable")
    }
  }, [])

  const isMobileTableLayout = viewportWidth < 768
  const titleColumnSize = isMobileTableLayout
    ? Math.max(260, Math.round(Math.min(viewportWidth - 36, 720)))
    : 560
  const titleColumnMinSize = isMobileTableLayout ? 200 : 460

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      setGlobalFilter(searchInput)
    }, 120)
    return () => window.clearTimeout(t)
  }, [searchInput])

  React.useEffect(() => {
    setRecentIndustryPicks(loadRecentFilterPicks(RECENT_INDUSTRIES_KEY))
    setRecentCountryPicks(loadRecentFilterPicks(RECENT_COUNTRIES_KEY))
  }, [])

  React.useEffect(() => {
    setColumnFilters((prev) => {
      const next = prev.filter(
        (f) => f.id !== "industry" && f.id !== "country" && f.id !== "city" && f.id !== "company"
      )
      if (industryFilter.length > 0) next.push({ id: "industry", value: industryFilter })
      if (countryFilter.length > 0) next.push({ id: "country", value: countryFilter })
      if (cityFilter) next.push({ id: "city", value: cityFilter })
      if (orgFilter) next.push({ id: "company", value: orgFilter })
      return next
    })
  }, [industryFilter, countryFilter, cityFilter, orgFilter])

  const columns = React.useMemo<ColumnDef<UseCaseCatalogRow>[]>(
    () => [
      {
        id: "title",
        accessorFn: (row) => useCaseDisplayName(row),
        size: titleColumnSize,
        minSize: titleColumnMinSize,
        maxSize: 2200,
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 text-[#b3b3b3] hover:bg-transparent hover:text-[#d8d8d8] focus-visible:ring-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Use Case
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const isNew = isUseCaseCatalogRowRecent24h(row.original)
          return (
            <div
              className={cn(
                "w-full min-w-0",
                tableDensity === "comfortable" && "space-y-1 md:space-y-1.5"
              )}
            >
              <div
                className={cn(
                  "flex min-w-0 flex-wrap items-center",
                  tableDensity === "compact" ? "gap-1" : "gap-1.5"
                )}
              >
                <button
                  type="button"
                  onClick={() => openDetail(row.original)}
                  className={cn(
                    "min-w-0 cursor-pointer overflow-hidden text-left text-ellipsis whitespace-normal break-words font-medium [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]",
                    tableDensity === "compact"
                      ? "text-[13px] leading-5 md:text-sm"
                      : "text-sm leading-6 md:text-[15px] md:leading-7"
                  )}
                  style={{
                    color: "#43cc93",
                    textDecoration: "underline",
                    textDecorationColor: "rgba(67,204,147,0.3)",
                    textUnderlineOffset: 3,
                  }}
                >
                  {useCaseDisplayName(row.original)}
                </button>
                {isNew ? (
                  <span
                    className={cn(
                      "shrink-0 rounded-full border border-yellow-300/55 bg-yellow-200/15 px-1.5 font-semibold uppercase tracking-wide text-yellow-200",
                      tableDensity === "compact" ? "py-0 text-[9px]" : "py-0.5 text-[10px]"
                    )}
                  >
                    New
                  </span>
                ) : null}
              </div>
              <div
                className={cn(
                  "overflow-hidden text-ellipsis whitespace-normal break-words text-[#8a8a8a] [display:-webkit-box] [-webkit-box-orient:vertical]",
                  tableDensity === "compact"
                    ? "[-webkit-line-clamp:2] text-[11px] leading-snug md:text-xs"
                    : "[-webkit-line-clamp:2] text-xs leading-relaxed md:[-webkit-line-clamp:3]"
                )}
              >
                {firstNonEmpty(row.original.description, row.original.sector)}
              </div>
            </div>
          )
        },
        enableHiding: false,
      },
      {
        id: "updated_at",
        accessorFn: (row) => row.updated_at ?? row.created_at ?? "",
        sortingFn: (rowA, rowB) => {
          const ts = (row: UseCaseCatalogRow) =>
            Date.parse(row.updated_at ?? row.created_at ?? "") || 0
          const a = ts(rowA.original)
          const b = ts(rowB.original)
          return a === b ? 0 : a < b ? -1 : 1
        },
        size: 160,
        minSize: 130,
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 text-[#b3b3b3] hover:bg-transparent hover:text-[#d8d8d8] focus-visible:ring-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Updated
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span
            className={cn(
              "text-[#8a8a8a]",
              tableDensity === "compact"
                ? "text-[11px] leading-tight md:text-xs"
                : "text-xs leading-relaxed"
            )}
          >
            {formatDate(row.original.updated_at ?? row.original.created_at)}
          </span>
        ),
      },
      {
        id: "company",
        accessorFn: (row) => firstNonEmpty(row.company_name, row.company_id),
        size: 220,
        minSize: 160,
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 text-[#b3b3b3] hover:bg-transparent hover:text-[#d8d8d8] focus-visible:ring-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Organizaiton
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div
            className={cn(
              "whitespace-normal break-words text-[#f5f5f5]",
              tableDensity === "compact"
                ? "text-xs leading-snug md:text-sm"
                : "text-sm leading-relaxed"
            )}
          >
            {firstNonEmpty(row.original.company_name, row.original.company_id)}
          </div>
        ),
      },
      {
        id: "industry",
        accessorFn: (row) => row.industry ?? "",
        filterFn: (row, _id, value) => {
          const selected = Array.isArray(value) ? (value as string[]) : []
          if (selected.length === 0) return true
          const current = row.original.industry?.trim() ?? ""
          return selected.includes(current)
        },
        size: 180,
        minSize: 140,
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 text-[#b3b3b3] hover:bg-transparent hover:text-[#d8d8d8] focus-visible:ring-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Industry
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div
            className={cn(
              "whitespace-normal break-words text-[#f5f5f5]",
              tableDensity === "compact"
                ? "text-xs leading-snug md:text-sm"
                : "text-sm leading-relaxed"
            )}
          >
            {row.original.industry ?? ""}
          </div>
        ),
      },
      {
        id: "country",
        accessorFn: (row) => row.country ?? "",
        filterFn: (row, _id, value) => {
          const selected = Array.isArray(value) ? (value as string[]) : []
          if (selected.length === 0) return true
          const current = row.original.country?.trim() ?? ""
          return selected.includes(current)
        },
        size: 140,
        minSize: 120,
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 text-[#b3b3b3] hover:bg-transparent hover:text-[#d8d8d8] focus-visible:ring-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Country
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div
            className={cn(
              "whitespace-normal break-words text-[#f5f5f5]",
              tableDensity === "compact"
                ? "text-xs leading-snug md:text-sm"
                : "text-sm leading-relaxed"
            )}
          >
            {row.original.country ?? ""}
          </div>
        ),
      },
      {
        id: "city",
        accessorFn: (row) => row.city ?? "",
        size: 140,
        minSize: 120,
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3 text-[#b3b3b3] hover:bg-transparent hover:text-[#d8d8d8] focus-visible:ring-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            City
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        id: "source",
        accessorFn: (row) => firstNonEmpty(row.reference_url, row.url, row.website_url),
        size: 120,
        minSize: 100,
        header: "Source",
        cell: ({ row }) => {
          const href = firstNonEmpty(
            row.original.reference_url,
            row.original.url,
            row.original.website_url
          )
          if (href === "—") return <span style={{ color: "#8a8a8a" }}>—</span>
          return (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: tableDensity === "compact" ? 11 : 12,
                color: "#43cc93",
                textDecoration: "underline",
                textDecorationColor: "rgba(67,204,147,0.4)",
                textUnderlineOffset: 3,
              }}
            >
              Open
              <ExternalLink style={{ width: 12, height: 12 }} />
            </a>
          )
        },
      },
    ],
    [openDetail, tableDensity, titleColumnMinSize, titleColumnSize]
  )

  const table = useReactTable({
    data: rows,
    columns,
    autoResetPageIndex: false,
    defaultColumn: {
      size: 160,
      minSize: 100,
      maxSize: 1600,
    },
    state: {
      sorting,
      globalFilter,
      columnFilters,
      pagination,
      columnVisibility,
    },
    columnResizeMode: "onChange",
    onSortingChange: (updater) => {
      setSorting((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater
        const col = next[0]
        if (!col?.id) {
          notifyAction("Sorting reset.")
        } else {
          const label = sortColumnLabel(col.id)
          notifyAction(
            `Sorted by ${label}${col.id === "updated_at" && !col.desc ? " (oldest first)" : col.desc ? " (descending)" : " (ascending)"}`
          )
        }
        return next
      })
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue || "").trim().toLowerCase()
      if (!q) return true

      const dateStr = row.original.updated_at ?? row.original.created_at ?? ""
      if (dateAfter || dateBefore) {
        const ts = dateStr ? Date.parse(dateStr) : NaN
        if (dateAfter && (Number.isNaN(ts) || ts < new Date(dateAfter).getTime())) return false
        if (dateBefore && (Number.isNaN(ts) || ts > new Date(dateBefore + "T23:59:59").getTime()))
          return false
      }

      const blob = [
        useCaseDisplayName(row.original),
        row.original.description,
        row.original.industry,
        row.original.country,
        row.original.city,
        row.original.company_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return blob.includes(q)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const filteredRows = table.getFilteredRowModel().rows
  const filteredRowCount = filteredRows.length

  const activeQuerySummary = React.useMemo(() => {
    const parts: string[] = []
    parts.push(
      `Showing ${filteredRowCount.toLocaleString()} result${filteredRowCount === 1 ? "" : "s"}`
    )
    if (industryFilter.length > 0) {
      parts.push(
        `${industryFilter.length} ${industryFilter.length === 1 ? "industry" : "industries"}`
      )
    }
    if (countryFilter.length > 0) {
      parts.push(
        `${countryFilter.length} ${countryFilter.length === 1 ? "country" : "countries"}`
      )
    }
    const q = globalFilter.trim()
    if (q) {
      parts.push(q.length > 40 ? `matching "${q.slice(0, 40)}…"` : `matching "${q}"`)
    }
    const col = sorting[0]
    const isDefaultUpdatedDesc = !col || (col.id === "updated_at" && col.desc)
    if (isDefaultUpdatedDesc) {
      parts.push("sorted by Updated")
    } else if (col && col.id === "updated_at" && !col.desc) {
      parts.push("sorted by Updated (oldest first)")
    } else if (col) {
      const label = sortColumnLabel(col.id)
      parts.push(`sorted by ${label} (${col.desc ? "descending" : "ascending"})`)
    }
    return parts.join(" · ")
  }, [countryFilter, filteredRowCount, globalFilter, industryFilter, sorting])

  const filteredOriginals = React.useMemo(
    () => filteredRows.map((r) => r.original),
    [filteredRows]
  )

  const dateFilteredRows = React.useMemo(() => {
    if (!dateAfter && !dateBefore) return filteredOriginals
    return filteredOriginals.filter((row) => {
      const dateStr = row.updated_at ?? row.created_at ?? ""
      const ts = dateStr ? Date.parse(dateStr) : NaN
      if (Number.isNaN(ts)) return false
      if (dateAfter && ts < new Date(dateAfter).getTime()) return false
      if (dateBefore && ts > new Date(dateBefore + "T23:59:59").getTime()) return false
      return true
    })
  }, [filteredOriginals, dateAfter, dateBefore])

  const kpiStats = React.useMemo(() => {
    const data = dateAfter || dateBefore ? dateFilteredRows : filteredOriginals
    const orgs = new Set<string>()
    const inds = new Set<string>()
    const ctrs = new Set<string>()
    for (const r of data) {
      const org = (r.company_name ?? r.company_id ?? "").trim()
      if (org) orgs.add(org)
      const ind = (r.industry ?? "").trim()
      if (ind) inds.add(ind)
      const ctr = (r.country ?? "").trim()
      if (ctr) ctrs.add(ctr)
    }
    return {
      filtered: data.length,
      total: rows.length,
      orgs: orgs.size,
      industries: inds.size,
      countries: ctrs.size,
    }
  }, [dateFilteredRows, filteredOriginals, dateAfter, dateBefore, rows.length])

  const industries = React.useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.industry?.trim()).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rows]
  )
  const countries = React.useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.country?.trim()).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rows]
  )
  const cities = React.useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.city?.trim()).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rows]
  )
  const organizations = React.useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((r) => (r.company_name ?? r.company_id ?? "").trim())
            .filter(Boolean) as string[]
        )
      ).sort((a, b) => a.localeCompare(b)),
    [rows]
  )

  const activeFilterCount =
    (searchInput.trim() ? 1 : 0) +
    industryFilter.length +
    countryFilter.length +
    (cityFilter ? 1 : 0) +
    (orgFilter ? 1 : 0) +
    (dateAfter ? 1 : 0) +
    (dateBefore ? 1 : 0)

  const advancedFilterCount =
    (cityFilter ? 1 : 0) + (orgFilter ? 1 : 0) + (dateAfter ? 1 : 0) + (dateBefore ? 1 : 0)

  const hasAnyDatasetRows = rows.length > 0
  const hasBaseFilters =
    Boolean(searchInput.trim()) || industryFilter.length > 0 || countryFilter.length > 0
  const hasAdvancedFilters =
    Boolean(cityFilter) || Boolean(orgFilter) || Boolean(dateAfter) || Boolean(dateBefore)

  const emptyStateCopy = React.useMemo(() => {
    if (!hasAnyDatasetRows && activeFilterCount === 0) {
      return {
        title: "Data not available right now",
        description:
          "The use case dataset is temporarily unavailable or still loading. Please refresh in a moment, or return later.",
      }
    }
    if (hasAdvancedFilters && !hasBaseFilters) {
      return {
        title: "No results for advanced filters",
        description:
          "City, Organization, or date range is too restrictive. Clear advanced filters or start with Industry/Country first.",
      }
    }
    return {
      title: "No use cases found",
      description:
        "Try broadening filters, removing date limits, or testing a shorter search phrase to find matches.",
    }
  }, [activeFilterCount, hasAdvancedFilters, hasAnyDatasetRows, hasBaseFilters])

  const applyExampleQuery = React.useCallback((query: string) => {
    setSearchInput(query)
    setGlobalFilter(query)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const totalPages = Math.max(table.getPageCount(), 1)
  const currentPage = table.getState().pagination.pageIndex + 1

  React.useEffect(() => {
    setPageJumpInput(String(currentPage))
  }, [currentPage])

  const commitPageJump = React.useCallback(() => {
    const parsed = Number.parseInt(pageJumpInput, 10)
    const safePage = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), totalPages) : currentPage
    setPageJumpInput(String(safePage))
    if (safePage !== currentPage) {
      setPagination((prev) => ({ ...prev, pageIndex: safePage - 1 }))
      notifyAction(`Jumped to page ${safePage}.`)
    }
  }, [currentPage, notifyAction, pageJumpInput, totalPages])

  function clearAllFilters() {
    setSearchInput("")
    setGlobalFilter("")
    setIndustryFilter([])
    setCountryFilter([])
    setCityFilter("")
    setOrgFilter("")
    setDateAfter("")
    setDateBefore("")
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    notifyAction("All filters cleared.")
  }

  React.useEffect(() => {
    const params = new URLSearchParams()
    if (globalFilter.trim()) params.set("q", globalFilter.trim())
    if (industryFilter.length > 0) params.set("industry", industryFilter.join(","))
    if (countryFilter.length > 0) params.set("country", countryFilter.join(","))
    if (sorting[0]?.id) {
      params.set("sort", `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}`)
    }
    params.set("page", String(pagination.pageIndex + 1))
    params.set("pageSize", String(pagination.pageSize))
    const visibleCols = ALL_COLUMN_IDS.filter((id) => columnVisibility[id] !== false)
    params.set("cols", visibleCols.join(","))
    const query = params.toString()
    const nextUrl = query ? `${pathname}?${query}` : pathname
    const currentQuery = typeof window !== "undefined" ? window.location.search.slice(1) : ""
    if (currentQuery !== query) {
      router.replace(nextUrl, { scroll: false })
    }
  }, [
    globalFilter,
    industryFilter,
    countryFilter,
    columnVisibility,
    sorting,
    pagination.pageIndex,
    pagination.pageSize,
    pathname,
    router,
  ])

  return (
    <div className="space-y-3 text-[#f5f5f5]">
      <div className="mb-1 flex items-center justify-between gap-2 -translate-y-[5px]">
        <Button
          asChild
          variant="outline"
          className="h-8 rounded-full px-3 text-xs font-semibold backdrop-blur-md"
        >
          <Link
            href="/"
            style={{
              borderColor: "rgba(165, 243, 252, 0.6)",
              backgroundColor: "rgba(34, 211, 238, 0.2)",
              color: "#cffafe",
              boxShadow: "0 0 0 1px rgba(103,232,249,0.25)",
            }}
          >
            Switch to Globe View
          </Link>
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-9 shrink-0 rounded-full border-slate-700/50 bg-slate-800/60 px-4 text-sm font-semibold leading-none text-white backdrop-blur-md hover:border-cyan-500/60 hover:bg-slate-700/60"
            >
              <CircleHelp className="h-4 w-4 shrink-0" aria-hidden />
              Help
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[min(85vh,520px)] overflow-y-auto border-cyan-500/25 bg-slate-900/98 text-[#f5f5f5] shadow-xl sm:max-w-md [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-800/70 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-500/65 hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400/80">
            <DialogHeader>
              <DialogTitle className="text-[#f8fafa]">Quick help</DialogTitle>
            </DialogHeader>
            <ul className="list-disc space-y-2.5 pl-4 text-sm leading-relaxed text-[#d7dedb]">
              <li>
                <strong className="font-medium text-[#f0f4f1]">Industry and Country:</strong>{" "}
                multi-select filters; the menu stays open while you tick several values (use &quot;All&quot;
                to clear that dimension). Values you have picked recently are tagged{" "}
                <span className="whitespace-nowrap">Recent</span> inside each list (stored locally in this
                browser).
              </li>
              <li>
                <strong className="font-medium text-[#f0f4f1]">&quot;New&quot; badge:</strong> the use case was
                updated within the last 24 hours (same rule as on the globe view).
              </li>
              <li>
                <strong className="font-medium text-[#f0f4f1]">Column widths:</strong> drag the grip
                between header cells to resize; double-click the grip to reset a column width (desktop).
              </li>
              <li>
                <strong className="font-medium text-[#f0f4f1]">Sharable URL:</strong> search text,
                industry/country selections, sort, visible columns, page, and page size are reflected in
                the address bar — copy the link to share the same view.
              </li>
              <li>
                <strong className="font-medium text-[#f0f4f1]">Search:</strong> matches use case title,
                description, organization name, industry, country, and city text.
              </li>
              <li>
                <strong className="font-medium text-[#f0f4f1]">Other filters:</strong> open{" "}
                <span className="whitespace-nowrap">Other Filters</span> for city, organization, and
                updated date range.
              </li>
              <li>
                <strong className="font-medium text-[#f0f4f1]">Details:</strong> click a row or the green
                underlined title to open the full detail panel; green links open sources in a new tab.
              </li>
              <li>
                <strong className="font-medium text-[#f0f4f1]">Table density:</strong>{" "}
                <span className="whitespace-nowrap">Compact</span> fits more rows on screen (especially on
                phones); <span className="whitespace-nowrap">Comfortable</span> adds spacing and, on larger
                screens, shows an extra subtitle line per row.
              </li>
            </ul>
          </DialogContent>
        </Dialog>
      </div>

      {/* Header + KPI Stats Strip */}
      <div className="mb-1 rounded-2xl border border-cyan-500/25 bg-slate-800/80 px-3 py-3 shadow-[0_8px_28px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md md:bg-slate-800/55 md:px-6 md:py-[9.5px] md:shadow-none">
        <div className="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between md:gap-2">
          <div
            className="flex items-center gap-2.5 md:translate-y-[6px] md:gap-2"
            style={{ position: "relative", top: "-6px" }}
          >
            <AtlasLogoMark />
            <h1 className="text-[1.06rem] font-semibold leading-snug tracking-[-0.02em] text-[#f8fafa] md:text-xl md:leading-normal">
              AI Atlas Use Case Index
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center md:gap-1.5 md:justify-end">
            <KpiStat
              icon={<Hash className="h-3 w-3" />}
              label="Total"
              value={`${kpiStats.filtered.toLocaleString()} / ${kpiStats.total.toLocaleString()}`}
            />
            <KpiStat
              icon={<Building2 className="h-3 w-3" />}
              label="Organizations"
              value={kpiStats.orgs}
            />
            <KpiStat
              icon={<Factory className="h-3 w-3" />}
              label="Industries"
              value={kpiStats.industries}
            />
            <KpiStat
              icon={<Globe className="h-3 w-3" />}
              label="Countries"
              value={kpiStats.countries}
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
        <Input
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
          }}
          placeholder="Search Use Case/ Orgnization / Industry ..."
          className="h-10 w-full rounded-full border-slate-700/50 bg-slate-800/60 py-0 text-base leading-none text-white placeholder:text-[#f5f5f5] focus-visible:border-cyan-500/60 focus-visible:ring-cyan-500/25 md:h-9 md:w-[535px] md:text-sm"
        />
        <div className="grid grid-cols-2 gap-2 md:ml-auto md:flex md:flex-row md:items-center md:justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 w-full rounded-full border-slate-700/50 bg-slate-800/60 px-3 py-0 text-sm leading-none text-white hover:border-cyan-500/60 hover:bg-slate-700/60 md:h-9 md:w-[185px]"
              >
                <span className="flex w-full min-w-0 items-center justify-center gap-2">
                  <Filter className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 truncate">
                    {industryFilter.length > 0
                      ? `${industryFilter.length} Industries`
                      : "Filter by Industry"}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[608px] overflow-y-auto border-cyan-500/25 bg-slate-900/95 text-white backdrop-blur-md [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-800/70 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-500/65 hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400/80">
              <DropdownMenuCheckboxItem
                className="text-[#f5f5f5] focus:bg-slate-800 focus:text-white"
                checked={industryFilter.length === 0}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => {
                  setIndustryFilter([])
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                  notifyAction("Industry filter cleared.")
                }}
              >
                All industries
              </DropdownMenuCheckboxItem>
              {industries.map((industry) => (
                <DropdownMenuCheckboxItem
                  key={industry}
                  className="w-full text-[#f5f5f5] focus:bg-slate-800 focus:text-white"
                  checked={industryFilter.includes(industry)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setRecentIndustryPicks((prev) => {
                        const next = bumpRecentPick(prev, industry)
                        persistRecentFilterPicks(RECENT_INDUSTRIES_KEY, next)
                        return next
                      })
                    }
                    setIndustryFilter((prev) =>
                      checked ? [...prev, industry] : prev.filter((v) => v !== industry)
                    )
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                    notifyAction(
                      checked
                        ? `Industry filter applied: ${industry}.`
                        : `Industry filter removed: ${industry}.`
                    )
                  }}
                >
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2 pr-1">
                    <span className="min-w-0 truncate">{industry}</span>
                    {recentIndustryPicks.includes(industry) ? (
                      <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-cyan-300/90">
                        Recent
                      </span>
                    ) : null}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 w-full rounded-full border-slate-700/50 bg-slate-800/60 px-3 py-0 text-sm leading-none text-white hover:border-cyan-500/60 hover:bg-slate-700/60 md:h-9 md:w-[175px]"
              >
                <span className="flex w-full min-w-0 items-center justify-center gap-2">
                  <Filter className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 truncate">
                    {countryFilter.length > 0
                      ? `${countryFilter.length} Countries`
                      : "Filter by Country"}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[608px] overflow-y-auto border-cyan-500/25 bg-slate-900/95 text-white backdrop-blur-md [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-800/70 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-500/65 hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400/80">
              <DropdownMenuCheckboxItem
                className="text-[#f5f5f5] focus:bg-slate-800 focus:text-white"
                checked={countryFilter.length === 0}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => {
                  setCountryFilter([])
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                  notifyAction("Country filter cleared.")
                }}
              >
                All countries
              </DropdownMenuCheckboxItem>
              {countries.map((country) => (
                <DropdownMenuCheckboxItem
                  key={country}
                  className="w-full text-[#f5f5f5] focus:bg-slate-800 focus:text-white"
                  checked={countryFilter.includes(country)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setRecentCountryPicks((prev) => {
                        const next = bumpRecentPick(prev, country)
                        persistRecentFilterPicks(RECENT_COUNTRIES_KEY, next)
                        return next
                      })
                    }
                    setCountryFilter((prev) =>
                      checked ? [...prev, country] : prev.filter((v) => v !== country)
                    )
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                    notifyAction(
                      checked
                        ? `Country filter applied: ${country}.`
                        : `Country filter removed: ${country}.`
                    )
                  }}
                >
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2 pr-1">
                    <span className="min-w-0 truncate">{country}</span>
                    {recentCountryPicks.includes(country) ? (
                      <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-cyan-300/90">
                        Recent
                      </span>
                    ) : null}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className={`relative h-10 w-full rounded-full border-slate-700/50 bg-slate-800/60 px-3 py-0 text-sm leading-none text-white hover:border-cyan-500/60 hover:bg-slate-700/60 md:h-9 md:w-[150px] ${
              showAdvanced ? "border-cyan-500/60 bg-cyan-500/12" : ""
            } ${advancedFilterCount > 0 ? "pr-9" : ""}`}
            onClick={() => setShowAdvanced((prev) => !prev)}
          >
            <span className="flex w-full min-w-0 items-center justify-center gap-2">
              <Filter className="h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">Other Filters</span>
            </span>
            {advancedFilterCount > 0 ? (
              <span className="absolute right-2.5 top-1/2 inline-flex h-4 min-w-4 -translate-y-1/2 items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-slate-950">
                {advancedFilterCount}
              </span>
            ) : null}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 w-full rounded-full border-slate-700/50 bg-slate-800/60 px-3 py-0 text-sm leading-none text-white hover:border-cyan-500/60 hover:bg-slate-700/60 md:h-9 md:w-[150px]"
              >
                <span className="flex w-full min-w-0 items-center justify-center gap-2">
                  <Columns3 className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 truncate">Columns</span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-cyan-500/25 bg-slate-900/95 text-white backdrop-blur-md">
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize text-[#f5f5f5] focus:bg-slate-800 focus:text-white"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                  >
                    {column.id.replaceAll("_", " ")}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced ? (
        <div className="w-full min-w-0 gap-2 rounded-xl border border-cyan-500/25 bg-slate-900/65 p-3 backdrop-blur-md max-md:grid max-md:grid-cols-1 max-md:[grid-template-columns:minmax(0,1fr)] md:flex md:flex-row md:flex-wrap md:items-center">
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-[#8a8a8a]">
            <MapPin className="h-3 w-3" />
            City
          </div>
          <div className="min-w-0 w-full md:w-auto">
            <Select
              value={cityFilter || "all"}
              onValueChange={(value) => {
                setCityFilter(value === "all" ? "" : value)
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                notifyAction(value === "all" ? "City filter cleared." : `City filter applied: ${value}.`)
              }}
            >
              <SelectTrigger className="h-9 w-full rounded-full border-slate-700/50 bg-slate-800/60 text-white md:w-[180px]">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent className="border-cyan-500/25 bg-slate-900/95 text-white backdrop-blur-md">
                <SelectItem className="text-[#f5f5f5] focus:bg-slate-800 focus:text-white" value="all">All cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem className="text-[#f5f5f5] focus:bg-slate-800 focus:text-white" key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-0 items-center gap-1.5 text-xs text-[#8a8a8a]">
            <Building2 className="h-3 w-3" />
            Organization
          </div>
          <div className="min-w-0 w-full md:w-auto">
            <Select
              value={orgFilter || "all"}
              onValueChange={(value) => {
                setOrgFilter(value === "all" ? "" : value)
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                notifyAction(
                  value === "all" ? "Organization filter cleared." : `Organization filter applied: ${value}.`
                )
              }}
            >
              <SelectTrigger className="h-9 w-full rounded-full border-slate-700/50 bg-slate-800/60 text-white md:w-[200px]">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent className="border-cyan-500/25 bg-slate-900/95 text-white backdrop-blur-md">
                <SelectItem className="text-[#f5f5f5] focus:bg-slate-800 focus:text-white" value="all">All organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem className="text-[#f5f5f5] focus:bg-slate-800 focus:text-white" key={org} value={org}>
                    {org}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-0 items-center gap-1.5 text-xs text-[#8a8a8a]">
            <Calendar className="h-3 w-3" />
            After
          </div>
          <AdvancedFilterDateField
            value={dateAfter}
            emptyLabel="After date"
            onChange={(next) => {
              setDateAfter(next)
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              notifyAction(next ? `Start date set: ${next}.` : "Start date cleared.")
            }}
          />

          <div className="flex min-w-0 items-center gap-1.5 text-xs text-[#8a8a8a]">
            <Calendar className="h-3 w-3" />
            Before
          </div>
          <AdvancedFilterDateField
            value={dateBefore}
            emptyLabel="Before date"
            onChange={(next) => {
              setDateBefore(next)
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              notifyAction(next ? `End date set: ${next}.` : "End date cleared.")
            }}
          />
        </div>
      ) : null}

      {/* Active Filter Tags */}
      {activeFilterCount > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {searchInput.trim() ? (
            <FilterChip
              label={`Search: "${searchInput.trim()}"`}
              onRemove={() => {
                setSearchInput("")
                setGlobalFilter("")
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            />
          ) : null}
          {industryFilter.map((industry) => (
            <FilterChip
              key={`industry-${industry}`}
              label={`Industry: ${industry}`}
              onRemove={() => {
                setIndustryFilter((prev) => prev.filter((v) => v !== industry))
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            />
          ))}
          {countryFilter.map((country) => (
            <FilterChip
              key={`country-${country}`}
              label={`Country: ${country}`}
              onRemove={() => {
                setCountryFilter((prev) => prev.filter((v) => v !== country))
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            />
          ))}
          {cityFilter ? (
            <FilterChip
              label={`City: ${cityFilter}`}
              onRemove={() => {
                setCityFilter("")
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            />
          ) : null}
          {orgFilter ? (
            <FilterChip
              label={`Organization: ${orgFilter}`}
              onRemove={() => {
                setOrgFilter("")
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            />
          ) : null}
          {dateAfter ? (
            <FilterChip
              label={`After: ${dateAfter}`}
              onRemove={() => {
                setDateAfter("")
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            />
          ) : null}
          {dateBefore ? (
            <FilterChip
              label={`Before: ${dateBefore}`}
              onRemove={() => {
                setDateBefore("")
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            />
          ) : null}
          {activeFilterCount > 1 ? (
            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-1 text-xs text-cyan-300 hover:text-cyan-200 hover:underline"
            >
              Clear all
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p
          className="min-w-0 flex-1 text-sm leading-snug text-[#b3b3b3] md:text-[13px]"
          role="status"
          aria-live="polite"
        >
          {activeQuerySummary}
        </p>
        <div
          className="flex shrink-0 justify-end"
          role="group"
          aria-label="Table row density"
        >
          <div className="inline-flex h-8 rounded-full border border-slate-700/50 bg-slate-800/60 p-0.5">
            <button
              type="button"
              onClick={() => setTableDensityPersist("compact")}
              className={cn(
                "rounded-full px-2.5 text-[11px] font-semibold transition-colors md:px-3 md:text-xs",
                tableDensity === "compact"
                  ? "bg-cyan-500/25 text-cyan-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                  : "text-[#9aa39e] hover:text-[#e8eeeb]"
              )}
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => setTableDensityPersist("comfortable")}
              className={cn(
                "rounded-full px-2.5 text-[11px] font-semibold transition-colors md:px-3 md:text-xs",
                tableDensity === "comfortable"
                  ? "bg-cyan-500/25 text-cyan-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                  : "text-[#9aa39e] hover:text-[#e8eeeb]"
              )}
            >
              Comfortable
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto overscroll-x-contain rounded-xl border border-[#2f2f2f] bg-[#181818] shadow-[0_8px_24px_-18px_rgba(30,215,96,0.6)] [-webkit-overflow-scrolling:touch]">
        <Table className="table-fixed [&_tbody_tr:hover]:bg-white/5 [&_td]:border-white/0 [&_th]:text-[#b3b3b3]" style={{ minWidth: `${table.getVisibleLeafColumns().reduce((sum, c) => sum + c.getSize(), 0)}px` }}>
          <TableHeader className="bg-[#0f0f0f]/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-[#2f2f2f] hover:bg-transparent">
                {headerGroup.headers.map((header, index) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      index === 0 ? "relative pl-4" : "relative",
                      tableDensity === "compact"
                        ? "!h-auto min-h-9 py-1.5 align-top"
                        : "!h-auto min-h-10 py-2 align-top md:min-h-11 md:py-3"
                    )}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <div
                          onDoubleClick={() => header.column.resetSize()}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute top-0 right-0 h-full w-5 cursor-ew-resize select-none touch-none bg-transparent hover:bg-[#43cc93]/30 md:w-2"
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="[&_tr]:border-[#2f2f2f]">
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer active:bg-white/8"
                  onClick={() => openDetail(row.original)}
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        index === 0 ? "pl-4 align-top whitespace-normal" : "align-top whitespace-normal",
                        tableDensity === "compact"
                          ? "!px-2.5 !py-2 md:!px-3"
                          : "!px-2.5 !py-2.5 md:!px-3.5 md:!py-4"
                      )}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={Math.max(table.getVisibleLeafColumns().length, 1)}
                  className="px-4 py-8 text-center"
                >
                  <div className="mx-auto max-w-xl space-y-2">
                    <p className="text-base font-medium text-[#e8eeeb]">{emptyStateCopy.title}</p>
                    <p className="text-sm text-[#8a8a8a]">{emptyStateCopy.description}</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 border-cyan-500/30 bg-slate-900/55 text-xs text-[#d7dedb] hover:border-cyan-500/55 hover:bg-slate-800/60"
                        onClick={clearAllFilters}
                      >
                        Clear all filters
                      </Button>
                      <button
                        type="button"
                        onClick={() => applyExampleQuery("manufacturing ai")}
                        className="text-xs text-cyan-300 underline-offset-2 hover:text-cyan-200 hover:underline"
                      >
                        Try example: &quot;manufacturing ai&quot;
                      </button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
        <p className="text-[#b3b3b3]">
          Showing {table.getRowModel().rows.length} / {table.getFilteredRowModel().rows.length} filtered rows
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => {
              setPagination((prev) => ({ ...prev, pageSize: Number(value), pageIndex: 0 }))
              notifyAction(`Rows per page set to ${value}.`)
            }}
          >
            <SelectTrigger
              className="!h-10 w-[120px] border-white/15 bg-[#181818] !py-0 leading-none text-[#f5f5f5]"
            >
              <span className="text-[#f5f5f5]">{pagination.pageSize} / page</span>
            </SelectTrigger>
            <SelectContent className="border-white/15 bg-[#181818] text-[#f5f5f5]">
              {[20, 50, 100].map((size) => (
                <SelectItem className="text-[#f5f5f5] focus:bg-slate-800 focus:text-white" key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex h-10 min-w-[92px] items-center rounded-md border border-white/15 bg-[#181818] px-2 text-sm font-medium tabular-nums text-[#f5f5f5]">
            <div className="mx-auto inline-flex w-[66px] items-center justify-center">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pageJumpInput}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, "")
                  setPageJumpInput(next)
                }}
                onBlur={commitPageJump}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    commitPageJump()
                  }
                }}
                className="h-full w-[28px] bg-transparent py-0 text-center text-sm leading-none font-medium text-[#f5f5f5] outline-none"
                aria-label="Current page number"
              />
              <span className="mx-1 text-[#9ba4a0]">/</span>
              <span className="min-w-[26px] text-center">{totalPages}</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="h-10 min-w-[80px] border-white/15 bg-[#1a1a1a] text-[#f5f5f5] hover:border-[#43cc93]/60 hover:bg-[#1f1f1f]"
            onClick={() => {
              table.previousPage()
              notifyAction("Moved to previous page.")
            }}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            className="h-10 min-w-[80px] border-white/15 bg-[#1a1a1a] text-[#f5f5f5] hover:border-[#43cc93]/60 hover:bg-[#1f1f1f]"
            onClick={() => {
              table.nextPage()
              notifyAction("Moved to next page.")
            }}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-500/20 bg-slate-900/45 px-3 py-2.5 text-center text-xs leading-relaxed text-[#9ba4a0]">
        <span className="font-medium text-[#c9d2cd]">Data note:</span> This index includes publicly
        referenced AI use cases and organizations currently tracked by AI Atlas. Data is refreshed
        periodically, with the latest update at <span className="text-[#d7dedb]">{latestDataUpdateCet}</span>.
      </div>

      {/* Detail Modal — portal to body to avoid stacking-context issues on mobile */}
      {activeDetail
        ? createPortal(
            <DetailModal detail={activeDetail} onClose={() => setActiveDetail(null)} />,
            document.body,
          )
        : null}

      <AtlasSiteFooter latestDataUpdateCet={latestDataUpdateCet} layout="inline" />
      <Toaster />
    </div>
  )
}

function DetailModal({
  detail,
  onClose,
}: {
  detail: UseCaseCatalogRow
  onClose: () => void
}) {
  const backdropRef = React.useRef<HTMLDivElement>(null)
  const openedAt = React.useRef(Date.now())

  React.useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target !== backdropRef.current) return
        if (Date.now() - openedAt.current < 350) return
        onClose()
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.72)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "94vw",
          maxWidth: 960,
          height: "78dvh",
          maxHeight: "78dvh",
          borderRadius: 16,
          border: "1px solid #2f2f2f",
          backgroundColor: "#1c1c1c",
          color: "#f5f5f5",
          boxShadow: "0 18px 48px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            padding: "16px 20px",
            borderBottom: "1px solid #2f2f2f",
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#f5f5f5",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                  flex: "1 1 auto",
                }}
              >
                {useCaseDisplayName(detail)}
              </h3>
              {isUseCaseCatalogRowRecent24h(detail) ? (
                <span
                  style={{
                    flexShrink: 0,
                    borderRadius: 9999,
                    border: "1px solid rgba(253,224,71,0.55)",
                    backgroundColor: "rgba(254,240,138,0.15)",
                    padding: "2px 8px",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "#fef9c3",
                  }}
                >
                  New
                </span>
              ) : null}
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#b3b3b3" }}>
              Organization: {firstNonEmpty(detail.company_name, detail.company_id)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            style={{
              flexShrink: 0,
              padding: 8,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              color: "#b3b3b3",
              cursor: "pointer",
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {detail.fieldEntries.map(({ key, label, value }) => {
            const trimmed = value.trim()
            const display = trimmed || "Not Available"
            const url = trimmed && isProbablyUrl(key, trimmed)

            return (
              <div
                key={key}
                style={{
                  display: "grid",
                  gap: 8,
                  padding: "12px 20px",
                  borderBottom: "1px solid #2f2f2f",
                }}
              >
                <p style={{ margin: 0, fontSize: 12, fontWeight: 500, letterSpacing: "0.03em", color: "#8a8a8a" }}>
                  {label}
                </p>
                {url ? (
                  <a
                    href={trimmed}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 14,
                      color: "#43cc93",
                      textDecoration: "underline",
                      textDecorationColor: "rgba(67,204,147,0.4)",
                      textUnderlineOffset: 3,
                      wordBreak: "break-all",
                      padding: "4px 0",
                    }}
                  >
                    <ExternalLink style={{ width: 14, height: 14, flexShrink: 0 }} />
                    {trimmed}
                  </a>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      color: trimmed ? "#f5f5f5" : "#8a8a8a",
                      fontStyle: trimmed ? "normal" : "italic",
                    }}
                  >
                    {display}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 py-0.5 pr-1 pl-2.5 text-xs text-[#d0d0d0]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 text-[#8a8a8a] hover:bg-white/10 hover:text-white"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}
