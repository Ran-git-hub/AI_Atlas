import type { UseCaseCatalogRow } from "@/lib/types"
import { useCaseDisplayName } from "@/lib/types"
import { UseCaseIndexShell } from "@/components/use-cases/use-case-index-shell"

/**
 * A plain server-rendered <a> for every row passed in.
 *
 * Why this exists: the catalog table is a client component, so none of its
 * rows reach the HTML a crawler sees. Without this list the only path Google
 * has to the 600+ detail pages is the sitemap, and sitemap-only URLs with no
 * internal links are what sit in "Discovered - currently not indexed".
 *
 * Deliberately bare markup: plain <a> rather than next/link, and every style
 * hoisted onto the <ul>. At ~680 rows a per-item className and a client
 * component reference each cost hundreds of KB in the RSC payload, and
 * next/link would also fire a prefetch per link as the list scrolls into view.
 *
 * The shell around the list only filters and collapses rows that are already
 * in the HTML, so every link stays crawlable with the list collapsed.
 */
export function UseCaseLinkIndex({
  rows,
  title,
  description,
  meta = "country",
}: {
  rows: UseCaseCatalogRow[]
  title: string
  description: string
  meta?: "country" | "industry"
}) {
  if (rows.length === 0) return null

  const organization = (row: UseCaseCatalogRow) => row.company_name?.trim() ?? ""
  const sorted = [...rows].sort(
    (a, b) =>
      organization(a).localeCompare(organization(b)) ||
      useCaseDisplayName(a).localeCompare(useCaseDisplayName(b)),
  )

  return (
    <section className="mt-6 rounded-xl border border-slate-800 bg-[#1a1a1a] p-5">
      <UseCaseIndexShell total={sorted.length} title={title} description={description}>
        <ul className="divide-y divide-slate-800/70 text-sm [&>li]:grid [&>li]:grid-cols-[minmax(0,1fr)_auto] [&>li]:items-baseline [&>li]:gap-x-4 [&>li]:gap-y-1 [&>li]:py-3 sm:[&>li]:grid-cols-[13rem_minmax(0,1fr)_auto] sm:[&>li]:gap-x-6 sm:[&>li]:py-2.5 [&_span]:min-w-0 [&_span]:truncate [&_span]:text-xs [&_span]:font-semibold [&_span]:text-[#43cc93]/90 sm:[&_span]:text-sm sm:[&_span]:text-slate-100 [&_a]:col-span-2 [&_a]:col-start-1 [&_a]:row-start-2 [&_a]:text-pretty [&_a]:text-[15px] [&_a]:leading-snug [&_a]:text-slate-200 [&_a]:transition-colors [&_a:hover]:text-[#43cc93] sm:[&_a]:col-span-1 sm:[&_a]:col-start-2 sm:[&_a]:row-start-1 sm:[&_a]:text-sm sm:[&_a]:text-slate-300 [&_i]:max-w-[9rem] [&_i]:truncate [&_i]:text-xs [&_i]:not-italic [&_i]:text-slate-500 sm:[&_i]:col-start-3 sm:[&_i]:row-start-1 sm:[&_i]:max-w-[15rem]">
          {sorted.map((row) => (
            <li key={row.id}>
              <span>{organization(row)}</span>
              <a href={`/use-cases/${encodeURIComponent(row.id)}`}>{useCaseDisplayName(row)}</a>
              <i>{(meta === "industry" ? row.industry : row.country)?.trim()}</i>
            </li>
          ))}
        </ul>
      </UseCaseIndexShell>
    </section>
  )
}
