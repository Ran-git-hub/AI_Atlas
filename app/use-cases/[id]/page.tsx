import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ChevronRight, ExternalLink } from "lucide-react"
import { getUseCaseCatalogRowById } from "@/lib/data"
import type { UseCaseCatalogRow } from "@/lib/types"
import { useCaseDisplayName } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Apple-style tokens from design-md/apple/DESIGN.md */
const APPLE = {
  black: "#000000",
  lightGray: "#f5f5f7",
  nearBlack: "#1d1d1f",
  appleBlue: "#0071e3",
  linkLight: "#0066cc",
  linkDark: "#2997ff",
} as const

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

function primaryExternalUrl(row: UseCaseCatalogRow): string | null {
  for (const v of [row.reference_url, row.url, row.website_url]) {
    const t = v?.trim()
    if (t && /^https?:\/\//i.test(t)) return t
  }
  return null
}

function subtitleForHero(row: UseCaseCatalogRow): string {
  const d = row.description?.trim()
  if (d) {
    const oneLine = d.split(/\n+/)[0]?.trim()
    if (oneLine && oneLine.length > 180) return `${oneLine.slice(0, 177)}…`
    if (oneLine) return oneLine
  }
  const parts = [row.industry?.trim(), row.sector?.trim()].filter(Boolean)
  if (parts.length) return parts.join(" · ")
  return "Documented AI deployment in the AI Atlas catalog."
}

type UseCaseDetailPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: UseCaseDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const row = await getUseCaseCatalogRowById(id)
  if (!row) return { title: "Use case" }
  const title = useCaseDisplayName(row)
  const desc = row.description?.trim()
  return {
    title: `${title} · AI Atlas`,
    description:
      desc ||
      `${title} — explore this AI use case in the AI Atlas catalog.`,
  }
}

export default async function UseCaseDetailPage({ params }: UseCaseDetailPageProps) {
  const { id } = await params
  const row = await getUseCaseCatalogRowById(id)
  if (!row) notFound()

  const title = useCaseDisplayName(row)
  const subtitle = subtitleForHero(row)
  const ctaUrl = primaryExternalUrl(row)

  return (
    <div className="min-h-dvh bg-black text-white antialiased">
      <header
        className="sticky top-0 z-50 flex h-12 items-center border-b border-white/10 px-4 md:px-6"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
        }}
      >
        <nav className="mx-auto flex w-full max-w-[980px] items-center justify-between gap-3">
          <Link
            href="/use-cases"
            className="inline-flex items-center gap-2 text-[12px] font-normal tracking-[-0.12px] text-white/90 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 rounded-sm"
            style={{ outlineColor: APPLE.appleBlue }}
          >
            <ArrowLeft className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
            Use cases
          </Link>
          <span
            className="truncate text-[12px] font-normal tracking-[-0.12px] text-white/50"
            title={title}
          >
            {title}
          </span>
        </nav>
      </header>

      <main>
        <section
          className="flex min-h-[calc(100dvh-3rem)] flex-col items-center justify-center px-5 pb-20 pt-16 text-center md:pb-28 md:pt-20"
          style={{ backgroundColor: APPLE.black }}
        >
          <p
            className="text-[12px] font-normal uppercase tracking-[0.08em] text-white/48"
            style={{ letterSpacing: "0.08em" }}
          >
            AI use case
          </p>
          <h1
            className="mt-3 max-w-[980px] text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.07] tracking-[-0.02em] text-white md:tracking-[-0.0175em]"
          >
            {title}
          </h1>
          <p
            className="mt-5 max-w-2xl text-pretty text-[1.06rem] font-normal leading-[1.47] text-white/90 tracking-[-0.023px] md:text-[1.31rem] md:leading-[1.19] md:tracking-[0.012px]"
          >
            {subtitle}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/use-cases"
              className="inline-flex items-center rounded-full border border-white bg-transparent px-6 py-2.5 text-[17px] font-normal leading-none text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ outlineColor: APPLE.appleBlue }}
            >
              Browse catalog
            </Link>
            {ctaUrl ? (
              <a
                href={ctaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg px-[15px] py-2 text-[17px] font-normal leading-[2.41] text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                style={{
                  backgroundColor: APPLE.appleBlue,
                  outlineColor: APPLE.appleBlue,
                }}
              >
                View source
                <ExternalLink className="h-4 w-4 opacity-90" aria-hidden />
              </a>
            ) : null}
          </div>

          {row.image_url?.trim() ? (
            <div
              className="relative mt-16 w-full max-w-[900px] overflow-hidden rounded-lg shadow-[3px_5px_30px_rgba(0,0,0,0.22)]"
              style={{ backgroundColor: APPLE.lightGray }}
            >
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={row.image_url.trim()}
                  alt=""
                  fill
                  className="object-contain p-6 md:p-10"
                  sizes="(max-width: 900px) 100vw, 900px"
                  priority
                />
              </div>
            </div>
          ) : null}
        </section>

        <section
          className="px-5 py-20 md:py-28"
          style={{ backgroundColor: APPLE.lightGray, color: APPLE.nearBlack }}
        >
          <div className="mx-auto max-w-[980px] text-left">
            <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.015em] text-[#1d1d1f] md:text-[40px]">
              At a glance
            </h2>
            <p
              className="mt-3 max-w-2xl text-[17px] font-normal  leading-[1.47] tracking-[-0.023px] text-[rgba(0,0,0,0.8)]"
            >
              Core facts from this catalog record. Primary narrative lives in the hero
              above; full raw fields follow in the next section.
            </p>
            <dl className="mt-12 grid gap-10 sm:grid-cols-3">
              {[
                {
                  k: "Organization",
                  v: firstNonEmpty(row.company_name, row.company_id),
                },
                { k: "Industry", v: firstNonEmpty(row.industry) },
                {
                  k: "Location",
                  v: firstNonEmpty(row.city, row.country, row.location),
                },
              ].map(({ k, v }) => (
                <div key={k}>
                  <dt
                    className="text-[14px] font-semibold leading-[1.29] tracking-[-0.224px] text-[rgba(0,0,0,0.48)]"
                  >
                    {k}
                  </dt>
                  <dd className="mt-2 text-[21px] font-normal leading-[1.19] tracking-[0.231px] text-[#1d1d1f]">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            {ctaUrl ? (
              <a
                href={ctaUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-12 inline-flex items-center gap-1 text-[14px] font-normal leading-[1.43] tracking-[-0.224px] transition-all hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 rounded-sm"
                style={{ color: APPLE.linkLight, outlineColor: APPLE.appleBlue }}
              >
                Open primary reference
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </a>
            ) : null}
          </div>
        </section>

        <section
          className="px-5 py-20 md:py-28"
          style={{ backgroundColor: APPLE.black }}
        >
          <div className="mx-auto max-w-[980px] text-left">
            <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.015em] text-white md:text-[40px]">
              Record fields
            </h2>
            <p
              className="mt-3 max-w-2xl text-[17px] font-normal leading-[1.47] tracking-[-0.023px] text-white/80"
            >
              Every column from the source row, in stable order. URLs open in a new
              tab.
            </p>

            <div className="mt-12 space-y-0">
              {row.fieldEntries.map(({ key, label, value }) => {
                const trimmed = value.trim()
                const display = trimmed || "Not Available"
                const url = trimmed && isProbablyUrl(key, trimmed)

                return (
                  <div
                    key={key}
                    className="grid gap-2 border-t border-white/10 py-5 first:border-t-0 first:pt-0 md:grid-cols-[minmax(160px,240px)_1fr] md:gap-8"
                  >
                    <p className="text-[14px] font-semibold leading-[1.29] tracking-[-0.224px] text-white/48">
                      {label}
                    </p>
                    {url ? (
                      <a
                        href={trimmed}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-start gap-1.5 break-all text-[17px] font-normal leading-[1.47] tracking-[-0.023px] transition-colors hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 rounded-sm"
                        style={{
                          color: APPLE.linkDark,
                          outlineColor: APPLE.appleBlue,
                        }}
                      >
                        <ExternalLink className="mt-1 h-4 w-4 shrink-0 opacity-80" />
                        {trimmed}
                      </a>
                    ) : (
                      <p
                        className={cn(
                          "whitespace-pre-wrap break-words text-[17px] font-normal leading-[1.47] tracking-[-0.023px]",
                          trimmed ? "text-white/90" : "text-white/45 italic"
                        )}
                      >
                        {display}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section
          className="px-5 py-16 md:py-20"
          style={{ backgroundColor: APPLE.lightGray }}
        >
          <div className="mx-auto flex max-w-[980px] flex-col items-start gap-4 text-left sm:flex-row sm:items-center sm:justify-between">
            <p
              className="text-[17px] font-normal leading-[1.47] tracking-[-0.023px] text-[rgba(0,0,0,0.8)]"
            >
              Continue exploring AI deployments in the catalog.
            </p>
            <Link
              href="/use-cases"
              className="inline-flex items-center rounded-lg px-[15px] py-2 text-[17px] font-normal text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{
                backgroundColor: APPLE.appleBlue,
                outlineColor: APPLE.appleBlue,
              }}
            >
              Back to use cases
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
