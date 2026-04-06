import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { getUseCaseCatalogRowById } from "@/lib/data"
import { useCaseDisplayName } from "@/lib/types"

function isProbablyUrl(key: string, value: string): boolean {
  if (!/^https?:\/\//i.test(value.trim())) return false
  if (value.includes("\n")) return false
  return /url|link|href|website|source|reference/i.test(key)
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const v = value?.trim()
    if (v) return v
  }
  return "—"
}

type UseCaseDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function UseCaseDetailPage({ params }: UseCaseDetailPageProps) {
  const { id } = await params
  const row = await getUseCaseCatalogRowById(id)
  if (!row) notFound()

  const title = useCaseDisplayName(row)

  return (
    <main className="min-h-screen bg-[#121212] text-[#f5f5f5]">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <Link
          href="/use-cases"
          className="mb-5 inline-flex items-center gap-2 text-sm text-[#b3b3b3] transition-colors hover:text-[#67d8a9]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to use cases
        </Link>

        <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#43cc93]/20 via-[#43cc93]/8 to-transparent p-6">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          <div className="mt-3 grid gap-2 text-sm text-[#c9c9c9] md:grid-cols-3">
            <p>
              <span className="text-[#8a8a8a]">Organization:</span>{" "}
              {firstNonEmpty(row.company_name, row.company_id)}
            </p>
            <p>
              <span className="text-[#8a8a8a]">Industry:</span> {firstNonEmpty(row.industry)}
            </p>
            <p>
              <span className="text-[#8a8a8a]">Location:</span>{" "}
              {firstNonEmpty(row.city, row.country)}
            </p>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-[#181818]">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-medium tracking-wide text-[#b3b3b3] uppercase">
              Record Fields
            </h2>
          </div>
          <div>
            {row.fieldEntries.map(({ key, label, value }) => {
              const trimmed = value.trim()
              const display = trimmed || "Not Available"
              const url = trimmed && isProbablyUrl(key, trimmed)

              return (
                <div
                  key={key}
                  className="grid gap-2 border-b border-white/10 px-5 py-3 last:border-b-0 md:grid-cols-[220px_1fr]"
                >
                  <p className="text-xs font-medium tracking-wide text-[#8a8a8a]">{label}</p>
                  {url ? (
                    <a
                      href={trimmed}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 break-all text-sm text-[#43cc93] hover:text-[#67d8a9] hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {trimmed}
                    </a>
                  ) : (
                    <p
                      className={`break-words whitespace-pre-wrap text-sm ${
                        trimmed ? "text-[#f5f5f5]" : "text-[#8a8a8a] italic"
                      }`}
                    >
                      {display}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
