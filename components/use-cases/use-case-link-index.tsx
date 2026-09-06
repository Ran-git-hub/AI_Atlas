import type { UseCaseCatalogRow } from "@/lib/types"
import { useCaseDisplayName } from "@/lib/types"

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
 */
export function UseCaseLinkIndex({
  rows,
  title,
  description,
}: {
  rows: UseCaseCatalogRow[]
  title: string
  description: string
}) {
  if (rows.length === 0) return null

  const sorted = [...rows].sort((a, b) =>
    useCaseDisplayName(a).localeCompare(useCaseDisplayName(b)),
  )

  return (
    <section className="mt-6 rounded-xl border border-slate-800 bg-[#1a1a1a] p-5">
      <h2 className="text-base font-semibold text-[#f5f5f5]">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
      <ul className="mt-4 grid gap-x-6 gap-y-1.5 text-sm text-slate-400 sm:grid-cols-2 lg:grid-cols-3 [&>li]:min-w-0 [&_a]:block [&_a]:truncate [&_a]:transition-colors [&_a:hover]:text-[#43cc93]">
        {sorted.map((row) => (
          <li key={row.id}>
            <a href={`/use-cases/${encodeURIComponent(row.id)}`}>
              {useCaseDisplayName(row)}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
