"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

// ── helpers ──────────────────────────────────────────────────────────────────

const VALID_CONTINENTS = new Set([
  "Asia", "Europe", "North America", "South America", "Africa", "Oceania", "Antarctica",
])

const VALID_GICS = new Set([
  "Aerospace & Defense", "Air Freight & Logistics", "Airlines", "Automobiles & Components",
  "Banks", "Biotechnology", "Broadline Retail", "Building Products", "Capital Markets",
  "Chemicals", "Commercial Services & Supplies", "Communications Equipment",
  "Construction Materials", "Consumer Finance", "Containers & Packaging",
  "Distributors", "Diversified Consumer Services", "Diversified Financial Services",
  "Diversified Telecommunication Services", "Electric Utilities", "Electrical Components & Equipment",
  "Electronic Equipment, Instruments & Components", "Energy Equipment & Services",
  "Entertainment", "Financial Services", "Food & Staples Retailing", "Food, Beverage & Tobacco",
  "Gas Utilities", "Ground Transportation", "Health Care Equipment & Supplies",
  "Health Care Providers & Services", "Health Care Technology", "Hotels, Restaurants & Leisure",
  "Household Durables", "Household Products", "Independent Power & Renewable Electricity Producers",
  "Industrial Conglomerates", "Insurance", "Interactive Media & Services",
  "Internet Software & Services", "IT Consulting & Other Services", "Leisure Products",
  "Life Sciences Tools & Services", "Machinery", "Marine Transportation",
  "Media", "Metals & Mining", "Mortgage Real Estate Investment Trusts",
  "Multi-Utilities", "Oil, Gas & Consumable Fuels", "Passenger Airlines",
  "Personal Care Products", "Pharmaceuticals", "Professional Services",
  "Public Sector / Government", "Real Estate Management & Development",
  "Research Institution", "Semiconductors & Semiconductor Equipment",
  "Semiconductors", "Software", "Specialty Retail",
  "Technology Hardware, Storage & Peripherals", "Textiles, Apparel & Luxury Goods",
  "Tobacco", "Trading Companies & Distributors", "Transportation Infrastructure",
  "Water Utilities", "Wireless Telecommunication Services",
])

const BLOCK_PATTERNS = ["/products/", "/wp-content/uploads/", "linkedin.com"]
const ALLOW_SUFFIXES = ["/about/news/", "/about-us/newsroom/", "/about/news-and-blogs/"]

// ── type ─────────────────────────────────────────────────────────────────────

interface Stats {
  // meta
  fetchedAt: string
  elapsed: number
  // use cases
  totalUc: number
  nullFields: Record<string, number>
  contentBuckets: Record<string, number>
  summaryBuckets: Record<string, number>
  summaryEndsDots: number
  continentDist: [string, number][]
  industryDist: [string, number][]
  countryDist: [string, number][]
  domainDist: [string, number][]
  confidenceBuckets: Record<string, number>
  invalidContinents: number
  blockedUrls: number
  contentShort: { id: string; title: string; len: number }[]
  ellipsisSummaries: { id: string; summary: string; len: number }[]
  // companies
  totalComp: number
  nullCompFields: Record<string, number>
  nonStdIndustries: number
  nonStdIndustryDetails: { id: string; name: string; industry: string }[]
  compIndustryDist: [string, number][]
  compCountryDist: [string, number][]
  missBothCityCountry: number
}

const INITIAL: Stats = {
  fetchedAt: "", elapsed: 0,
  totalUc: 0, nullFields: {}, contentBuckets: {}, summaryBuckets: {},
  summaryEndsDots: 0,
  continentDist: [], industryDist: [], countryDist: [], domainDist: [],
  confidenceBuckets: {}, invalidContinents: 0, blockedUrls: 0,
  contentShort: [], ellipsisSummaries: [],
  totalComp: 0, nullCompFields: {}, nonStdIndustries: 0,
  nonStdIndustryDetails: [],
  compIndustryDist: [], compCountryDist: [], missBothCityCountry: 0,
}

// ── analysis ─────────────────────────────────────────────────────────────────

async function analyze(): Promise<Stats> {
  const supabase = createClient()
  const t0 = performance.now()
  const fetchedAt = new Date().toISOString()

  // bulk fetch all data — Supabase anon key has select on both tables
  const [ucRes, compRes] = await Promise.all([
    supabase.from("AI_Atlas_Use_Cases").select("*"),
    supabase.from("AI_Atlas_Companies").select("*"),
  ])

  const uc = ucRes.data ?? []
  const comp = compRes.data ?? []

  // ── Use Cases ──────────────────────────────────────────────────
  const totalUc = uc.length
  const fields = ["title", "URL", "summary", "content", "type", "industry", "country", "continent"]

  const nullFields: Record<string, number> = {}
  for (const f of fields) {
    nullFields[f] = uc.filter((r: any) => r[f] == null).length
  }

  // content buckets
  const contentBuckets: Record<string, number> = { "<300": 0, "300-1000": 0, "1000-3000": 0, ">3000": 0 }
  for (const r of uc) {
    const l = (r.content ?? "").length
    if (l < 300) contentBuckets["<300"]++
    else if (l < 1000) contentBuckets["300-1000"]++
    else if (l < 3000) contentBuckets["1000-3000"]++
    else contentBuckets[">3000"]++
  }

  // summary buckets
  const summaryBuckets: Record<string, number> = { "<100": 0, "100-200": 0, "200-400": 0, ">400": 0 }
  for (const r of uc) {
    const l = (r.summary ?? "").length
    if (l < 100) summaryBuckets["<100"]++
    else if (l < 200) summaryBuckets["100-200"]++
    else if (l < 400) summaryBuckets["200-400"]++
    else summaryBuckets[">400"]++
  }

  const summaryEndsDots = uc.filter((r: any) => (r.summary ?? "").endsWith("...")).length
  const ellipsisSummaries = uc
    .filter((r: any) => (r.summary ?? "").endsWith("..."))
    .slice(0, 40)
    .map((r: any) => ({ id: r.id, summary: (r.summary ?? "").slice(0, 120), len: (r.summary ?? "").length }))

  // continent
  const contMap: Record<string, number> = {}
  for (const r of uc) {
    const c = r.continent ?? "(empty)"
    contMap[c] = (contMap[c] ?? 0) + 1
  }
  const continentDist = Object.entries(contMap).sort((a, b) => b[1] - a[1])
  const invalidContinents = uc.filter((r: any) => r.continent && !VALID_CONTINENTS.has(r.continent)).length

  // industry
  const indMap: Record<string, number> = {}
  for (const r of uc) {
    const i = r.industry ?? "(empty)"
    indMap[i] = (indMap[i] ?? 0) + 1
  }
  const industryDist = Object.entries(indMap).sort((a, b) => b[1] - a[1]).slice(0, 15)

  // country
  const cntryMap: Record<string, number> = {}
  for (const r of uc) {
    const c = r.country ?? "(empty)"
    cntryMap[c] = (cntryMap[c] ?? 0) + 1
  }
  const countryDist = Object.entries(cntryMap).sort((a, b) => b[1] - a[1]).slice(0, 15)

  // domains
  const domMap: Record<string, number> = {}
  for (const r of uc) {
    const u = r.URL ?? ""
    if (!u) continue
    try {
      const host = new URL(u).hostname
      domMap[host] = (domMap[host] ?? 0) + 1
    } catch { /* skip */ }
  }
  const domainDist = Object.entries(domMap).sort((a, b) => b[1] - a[1]).slice(0, 15)

  // confidence
  const confBuckets: Record<string, number> = { "<0.5": 0, "0.5-0.7": 0, "0.7-0.85": 0, "0.85-1.0": 0 }
  for (const r of uc) {
    const cs = r.confidence_score ?? 0
    if (cs < 0.5) confBuckets["<0.5"]++
    else if (cs < 0.7) confBuckets["0.5-0.7"]++
    else if (cs < 0.85) confBuckets["0.7-0.85"]++
    else confBuckets["0.85-1.0"]++
  }

  // blocked URLs
  let blocked = 0
  for (const r of uc) {
    const u = r.URL ?? ""
    if (!u) continue
    for (const pat of BLOCK_PATTERNS) {
      if (u.includes(pat)) {
        if (ALLOW_SUFFIXES.some(s => u.endsWith(s))) continue
        blocked++
        break
      }
    }
  }

  const contentShort = uc
    .filter((r: any) => (r.content ?? "").length < 300)
    .map((r: any) => ({ id: r.id, title: r.title, len: (r.content ?? "").length }))

  // ── Companies ──────────────────────────────────────────────────
  const totalComp = comp.length
  const compFields = ["name", "industry", "website_url", "description", "city", "headquarters_country"]
  const nullCompFields: Record<string, number> = {}
  for (const f of compFields) {
    nullCompFields[f] = comp.filter((r: any) => r[f] == null).length
  }

  const nonStd = comp.filter((r: any) => r.industry && !VALID_GICS.has(r.industry))
  const nonStdIndustryDetails = nonStd.slice(0, 30).map((r: any) => ({ id: r.id, name: r.name, industry: r.industry }))

  const cIndMap: Record<string, number> = {}
  for (const r of comp) {
    const i = r.industry ?? "(empty)"
    cIndMap[i] = (cIndMap[i] ?? 0) + 1
  }
  const compIndustryDist = Object.entries(cIndMap).sort((a, b) => b[1] - a[1]).slice(0, 15)

  const cCtryMap: Record<string, number> = {}
  for (const r of comp) {
    const c = r.headquarters_country ?? "(empty)"
    cCtryMap[c] = (cCtryMap[c] ?? 0) + 1
  }
  const compCountryDist = Object.entries(cCtryMap).sort((a, b) => b[1] - a[1]).slice(0, 15)

  const missBothCityCountry = comp.filter((r: any) => !r.city && !r.headquarters_country).length

  const elapsed = performance.now() - t0

  return {
    fetchedAt, elapsed,
    totalUc, nullFields, contentBuckets, summaryBuckets, summaryEndsDots,
    continentDist, industryDist, countryDist, domainDist,
    confidenceBuckets: confBuckets, invalidContinents, blockedUrls: blocked,
    contentShort, ellipsisSummaries,
    totalComp, nullCompFields, nonStdIndustries: nonStd.length,
    nonStdIndustryDetails,
    compIndustryDist, compCountryDist, missBothCityCountry,
  }
}

// ── components ───────────────────────────────────────────────────────────────

function Bar({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function CompletionBadge({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? (current / total) * 100 : 0
  if (pct === 100) return <span className="text-green-600 font-medium">✅ {current}/{total}</span>
  if (pct >= 80) return <span className="text-yellow-600 font-medium">⚠️ {current}/{total}</span>
  return <span className="text-red-600 font-medium">❌ {current}/{total}</span>
}

function MetricCard({ label, current, total }: { label: string; current: number; total: number }) {
  const pct = total > 0 ? (current / total) * 100 : 0
  const color = pct === 100 ? "bg-green-500" : pct >= 80 ? "bg-yellow-500" : "bg-red-500"
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-xl font-bold">{current}</span>
        <span className="text-sm text-gray-400">/ {total}</span>
        <span className="text-sm ml-auto">{pct.toFixed(1)}%</span>
      </div>
      <Bar value={current} max={total} color={color} />
    </div>
  )
}

function DistTable({ data, label = "Item" }: { data: [string, number][]; label?: string }) {
  const maxVal = Math.max(...data.map(([_, v]) => v), 1)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 pr-4 font-medium text-gray-500">{label}</th>
            <th className="text-right py-2 px-2 font-medium text-gray-500">Count</th>
            <th className="text-right py-2 px-2 font-medium text-gray-500 w-36">Distribution</th>
          </tr>
        </thead>
        <tbody>
          {data.map(([item, count]) => (
            <tr key={item} className="border-b border-gray-100">
              <td className="py-1.5 pr-4 text-gray-800 max-w-[260px] truncate">{item}</td>
              <td className="py-1.5 px-2 text-right font-medium tabular-nums">{count}</td>
              <td className="py-1.5 pl-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(count / maxVal) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right tabular-nums">
                    {((count / (data.reduce((a, [_, c]) => a + c, 0))) * 100).toFixed(1)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── main dashboard ──────────────────────────────────────────────────────────

export function QualityDashboard() {
  const [stats, setStats] = useState<Stats>(INITIAL)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await analyze()
      setStats(result)
    } catch (e: any) {
      setError(e?.message ?? "Failed to analyze database")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto text-center py-20">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Failed to load data</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold">Database Quality Dashboard</h1>
            <div className="flex gap-2">
              <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full">Read-only</span>
              <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded-full">Live</span>
            </div>
          </div>
          <div className="flex items-baseline gap-4 text-sm text-gray-400">
            {loading ? (
              <span>Analyzing database...</span>
            ) : (
              <>
                <span>Updated: {new Date(stats.fetchedAt).toLocaleString("en-GB", { timeZone: "CET" })}</span>
                <span>⏱ {(stats.elapsed / 1000).toFixed(1)}s</span>
                <button onClick={fetchData} className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                  Refresh
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="max-w-5xl mx-auto p-6 space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-4 bg-gray-200 rounded w-48 mb-4" />
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-20 bg-gray-100 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-5xl mx-auto p-6 space-y-8">

          {/* ── Overview ──────────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="text-xl">📊</span> Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                <div className="text-gray-500 text-xs uppercase tracking-wide">Use Cases</div>
                <div className="text-3xl font-bold mt-1">{stats.totalUc}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                <div className="text-gray-500 text-xs uppercase tracking-wide">Companies</div>
                <div className="text-3xl font-bold mt-1">{stats.totalComp}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                <div className="text-gray-500 text-xs uppercase tracking-wide">Countries (UC)</div>
                <div className="text-3xl font-bold mt-1">{stats.countryDist.length}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                <div className="text-gray-500 text-xs uppercase tracking-wide">Industries (UC)</div>
                <div className="text-3xl font-bold mt-1">{stats.industryDist.length}</div>
              </div>
            </div>
          </section>

          {/* ── UC Field Completeness ─────────────────────────── */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="text-xl">📋</span> Use Cases — Field Completeness</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(stats.nullFields).map(([field, nulls]) => (
                <MetricCard key={field} label={field} current={stats.totalUc - nulls} total={stats.totalUc} />
              ))}
            </div>
          </section>

          {/* ── Content Length ────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="text-xl">📝</span> Content Length</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <DistTable data={Object.entries(stats.contentBuckets)} label="Bucket" />
            </div>
          </section>

          {/* ── Summary Length ────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="text-xl">📌</span> Summary Length</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <DistTable data={Object.entries(stats.summaryBuckets)} label="Bucket" />
            </div>
            {stats.summaryEndsDots > 0 && (
              <details className="mt-3">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  {stats.summaryEndsDots} summaries end with &quot;...&quot;
                </summary>
                <div className="mt-2 max-h-60 overflow-y-auto text-xs space-y-1">
                  {stats.ellipsisSummaries.map((s) => (
                    <div key={s.id} className="bg-white rounded border border-gray-100 p-2">
                      <span className="text-gray-700">{s.summary}</span>
                      <span className="text-gray-400 ml-2">({s.len}c)</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </section>

          {/* ── Continent · Industry · Country ────────────────── */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="text-xl">🌍</span> Distributions</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-medium text-sm text-gray-500 mb-3 uppercase tracking-wide">Continent</h3>
                {stats.invalidContinents === 0 ? (
                  <div className="text-xs text-green-600 mb-3">✅ All values valid</div>
                ) : (
                  <div className="text-xs text-red-600 mb-3">❌ {stats.invalidContinents} invalid values</div>
                )}
                <DistTable data={stats.continentDist} />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-medium text-sm text-gray-500 mb-3 uppercase tracking-wide">Industry (Top 15)</h3>
                <DistTable data={stats.industryDist} />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-medium text-sm text-gray-500 mb-3 uppercase tracking-wide">Country (Top 15)</h3>
                <DistTable data={stats.countryDist} />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-medium text-sm text-gray-500 mb-3 uppercase tracking-wide">URL Domain (Top 15)</h3>
                {stats.blockedUrls === 0 ? (
                  <div className="text-xs text-green-600 mb-3">✅ No blocked URL patterns</div>
                ) : (
                  <div className="text-xs text-red-600 mb-3">❌ {stats.blockedUrls} URLs match blocking patterns</div>
                )}
                <DistTable data={stats.domainDist} />
              </div>
            </div>
          </section>

          {/* ── Confidence Score ──────────────────────────────── */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="text-xl">🎯</span> Confidence Score</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <DistTable data={Object.entries(stats.confidenceBuckets)} label="Range" />
            </div>
            {stats.contentShort.length > 0 && (
              <details className="mt-3">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  {stats.contentShort.length} records with content &lt; 300 chars
                </summary>
                <div className="mt-2 text-xs space-y-1">
                  {stats.contentShort.map((r) => (
                    <div key={r.id} className="bg-white rounded border border-gray-100 p-2">
                      <span className="text-gray-700">{r.title}</span>
                      <span className="text-gray-400 ml-2">({r.len}c)</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </section>

          {/* ── Companies ─────────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="text-xl">🏢</span> Companies — Field Completeness</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(stats.nullCompFields).map(([field, nulls]) => (
                <MetricCard key={field} label={field} current={stats.totalComp - nulls} total={stats.totalComp} />
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-medium text-sm text-gray-500 mb-3 uppercase tracking-wide">GICS Industry (Top 15)</h3>
                {stats.nonStdIndustries === 0 ? (
                  <div className="text-xs text-green-600 mb-3">✅ All values standard GICS</div>
                ) : (
                  <div className="text-xs text-red-600 mb-3">❌ {stats.nonStdIndustries} non-standard values</div>
                )}
                <DistTable data={stats.compIndustryDist} />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-medium text-sm text-gray-500 mb-3 uppercase tracking-wide">HQ Country (Top 15)</h3>
                <DistTable data={stats.compCountryDist} />
              </div>
            </div>
          </section>

          <footer className="text-center text-xs text-gray-400 py-6">
            AI Atlas Data Quality Dashboard · Data fetched via Supabase anon key · Every refresh is live
          </footer>

        </div>
      )}
    </div>
  )
}
