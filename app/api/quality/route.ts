import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const VALID_CONTINENTS = new Set([
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Africa",
  "Oceania",
  "Antarctica",
])

const VALID_GICS = new Set([
  "Energy Equipment & Services",
  "Oil, Gas & Consumable Fuels",
  "Chemicals",
  "Construction Materials",
  "Metals & Mining",
  "Steel",
  "Aluminum",
  "Copper",
  "Precious Metals & Minerals",
  "Aerospace & Defense",
  "Building Products",
  "Construction & Engineering",
  "Electrical Components & Equipment",
  "Heavy Electrical Equipment",
  "Industrial Conglomerates",
  "Construction Machinery & Heavy Transportation Equipment",
  "Agricultural & Farm Machinery",
  "Industrial Machinery & Supplies & Components",
  "Air Freight & Logistics",
  "Airlines",
  "Marine Transportation",
  "Ground Transportation",
  "Transportation Infrastructure",
  "Automobiles & Components",
  "Consumer Electronics",
  "Housewares & Specialties",
  "Leisure Products",
  "Tourism & Recreation",
  "Education",
  "Distributors",
  "Broadline Retail",
  "Specialty Retail",
  "Consumer Staples Distribution & Retail",
  "Food, Beverage & Tobacco",
  "Household & Personal Care Products",
  "Health Care Equipment & Supplies",
  "Health Care Technology",
  "Biotechnology",
  "Life Sciences Tools & Services",
  "Pharmaceuticals",
  "Health Care Providers & Services",
  "Banks",
  "Financial Exchanges & Data",
  "Asset Management & Custody Banks",
  "Investment Banking & Brokerage",
  "Insurance",
  "Financial Services",
  "Consumer Finance",
  "Capital Markets",
  "Real Estate",
  "Health Care REITs",
  "Hotel & Resort REITs",
  "Office REITs",
  "Retail REITs",
  "Residential REITs",
  "Industrial REITs",
  "Specialized REITs",
  "Internet Software & Services",
  "IT Consulting & Other Services",
  "Data Processing & Outsourced Services",
  "Application Software",
  "Systems Software",
  "Technology Hardware Storage",
  "Communications Equipment",
  "Technology Hardware & Equipment",
  "Electronic Equipment & Instruments",
  "Electronic Components",
  "Semiconductor Materials & Equipment",
  "Semiconductors",
  "Wireless Telecommunication Services",
  "Telecommunication Services",
  "Broadcasting",
  "Cable & Satellite",
  "Advertising",
  "Media & Entertainment",
  "Publishing",
  "Electric Utilities",
  "Gas Utilities",
  "Water Utilities",
  "Multi-Utilities",
  "Research Institution",
  "Public Sector / Government",
])

function normalizeTaxonomyValue(value: unknown): string {
  return text(value).toLowerCase().replace(/\s+/g, " ").trim()
}

const VALID_GICS_NORMALIZED = new Set([...VALID_GICS].map(normalizeTaxonomyValue))

const COUNTRY_CONTINENT: Record<string, string> = {
  Australia: "Oceania",
  Brazil: "South America",
  Canada: "North America",
  China: "Asia",
  France: "Europe",
  Germany: "Europe",
  India: "Asia",
  Israel: "Asia",
  Japan: "Asia",
  Netherlands: "Europe",
  Norway: "Europe",
  Singapore: "Asia",
  Sweden: "Europe",
  Switzerland: "Europe",
  "South Korea": "Asia",
  "United Kingdom": "Europe",
  "United States": "North America",
}

const USE_CASE_REQUIRED_FIELDS = [
  "status",
  "title",
  "summary",
  "content",
  "URL",
  "company_id",
  "country",
  "city",
  "continent",
  "industry",
  "type",
  "confidence_score",
  "source_name",
]

const COMPANY_REQUIRED_FIELDS = [
  "name",
  "description",
  "industry",
  "headquarters_country",
  "city",
  "website_url",
]

const BAD_URL_PATTERNS = [
  "linkedin.com",
  "/products",
  "/product/",
  "/pricing",
  "/contact",
  "/about",
  "/features",
  "/plans",
  "/wp-content/uploads/",
]

const NAVIGATION_TERMS = [
  "Products",
  "Pricing",
  "Plans",
  "Buy Now",
  "Sign Up",
  "Login",
  "Cookie Policy",
  "GDPR",
  "Terms of Service",
  "Privacy Policy",
  "Get Started",
  "Request Demo",
  "Accept All",
  "Reject All",
]

const HTML_REMNANTS = [
  ".button",
  ".nav",
  ".footer",
  ".header",
  ".sidebar",
  "class=\"\"",
  "inline styles",
  "var(",
  "CSS",
]

const GENERIC_MARKETING_PHRASES = [
  "We provide AI-powered solutions for enterprise customers",
  "Leading provider of machine learning and data analytics",
  "Helps businesses transform with artificial intelligence",
]

type Row = Record<string, unknown>

type IssueSample = {
  id: string
  label: string
  detail?: string
}

type RuleResult = {
  id: string
  name: string
  table: "Use Cases" | "Companies"
  dimension: "Completeness" | "Validity" | "Consistency" | "Uniqueness" | "Traceability"
  severity: "critical" | "warning" | "info"
  total: number
  failed: number
  samples: IssueSample[]
}

const SEVERITY_SCORE_WEIGHTS: Record<RuleResult["severity"], number> = {
  critical: 3,
  warning: 2,
  info: 1,
}

const SEVERITY_FAILURE_MULTIPLIERS: Record<RuleResult["severity"], number> = {
  critical: 3,
  warning: 2,
  info: 1,
}

function roundScore(value: number): number {
  return Math.round(value * 10) / 10
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "")
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function getNumber(row: Row, keys: string[]): number | null {
  for (const key of keys) {
    const value = row[key]
    if (value === null || value === undefined || value === "") continue
    const num = typeof value === "number" ? value : Number(value)
    if (Number.isFinite(num)) return num
  }
  return null
}

function rowLabel(row: Row, fallback = "Record"): string {
  return text(row.title) || text(row.name) || text(row.URL) || text(row.website_url) || String(row.id ?? fallback)
}

function getId(row: Row): string {
  return String(row.id ?? row.URL ?? row.name ?? "unknown")
}

function hasBadCoordinate(row: Row): boolean {
  const lat = getNumber(row, ["latitude", "lat"])
  const lng = getNumber(row, ["longitude", "lng"])
  if (lat === null || lng === null) return true
  if (lat === 0 && lng === 0) return true
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return true
  if (Math.abs(lat) >= 999 || Math.abs(lng) >= 999) return true
  return false
}

function isBadUseCaseUrl(raw: string): boolean {
  if (!raw) return true
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return true
  }
  const lower = raw.toLowerCase()
  if (BAD_URL_PATTERNS.some((pattern) => lower.includes(pattern))) return true
  return url.pathname === "/" || url.pathname === ""
}

function countBy(rows: Row[], key: string): [string, number][] {
  const map = new Map<string, number>()
  for (const row of rows) {
    const value = text(row[key]) || "(empty)"
    map.set(value, (map.get(value) ?? 0) + 1)
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

function countByDomain(rows: Row[]): [string, number][] {
  const map = new Map<string, number>()
  for (const row of rows) {
    const raw = text(row.URL)
    if (!raw) continue
    try {
      const host = new URL(raw).hostname.toLowerCase()
      map.set(host, (map.get(host) ?? 0) + 1)
    } catch {
      map.set("(invalid URL)", (map.get("(invalid URL)") ?? 0) + 1)
    }
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

function duplicateSamples(rows: Row[], key: string): IssueSample[] {
  const seen = new Map<string, Row[]>()
  for (const row of rows) {
    const value = text(row[key]).toLowerCase()
    if (!value) continue
    const group = seen.get(value) ?? []
    group.push(row)
    seen.set(value, group)
  }
  return [...seen.entries()]
    .filter(([, group]) => group.length > 1)
    .slice(0, 12)
    .map(([value, group]) => ({
      id: getId(group[0]),
      label: value,
      detail: `${group.length} records`,
    }))
}

function sample(rows: Row[], detail: (row: Row) => string | undefined = () => undefined): IssueSample[] {
  return rows.slice(0, 12).map((row) => ({
    id: getId(row),
    label: rowLabel(row),
    detail: detail(row),
  }))
}

function makeRule(
  id: string,
  name: string,
  table: RuleResult["table"],
  dimension: RuleResult["dimension"],
  severity: RuleResult["severity"],
  total: number,
  failedRows: Row[],
  detail?: (row: Row) => string | undefined
): RuleResult {
  return {
    id,
    name,
    table,
    dimension,
    severity,
    total,
    failed: failedRows.length,
    samples: sample(failedRows, detail),
  }
}

async function fetchAll(table: string): Promise<Row[]> {
  const supabase = await createClient()
  const pageSize = 1000
  const rows: Row[] = []

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + pageSize - 1)

    if (error) throw error
    rows.push(...((data ?? []) as Row[]))
    if (!data || data.length < pageSize) break
  }

  return rows
}

export async function GET() {
  const started = performance.now()
  const [useCases, companies] = await Promise.all([
    fetchAll("AI_Atlas_Use_Cases"),
    fetchAll("AI_Atlas_Companies"),
  ])

  const companyIds = new Set(companies.map((row) => String(row.id)).filter(Boolean))
  const companyById = new Map(companies.map((row) => [String(row.id), row]))

  const rules: RuleResult[] = []

  for (const field of USE_CASE_REQUIRED_FIELDS) {
    rules.push(makeRule(
      `uc-required-${field}`,
      `Use cases: ${field} is mandatory`,
      "Use Cases",
      "Completeness",
      "critical",
      useCases.length,
      useCases.filter((row) => isBlank(row[field]))
    ))
  }

  rules.push(makeRule(
    "uc-coordinates",
    "Use cases: city coordinates must be real values",
    "Use Cases",
    "Completeness",
    "critical",
    useCases.length,
    useCases.filter(hasBadCoordinate)
  ))

  for (const field of COMPANY_REQUIRED_FIELDS) {
    rules.push(makeRule(
      `company-required-${field}`,
      `Companies: ${field} is mandatory`,
      "Companies",
      "Completeness",
      "critical",
      companies.length,
      companies.filter((row) => isBlank(row[field]))
    ))
  }

  rules.push(makeRule(
    "company-coordinates",
    "Companies: HQ coordinates must be real values",
    "Companies",
    "Completeness",
    "critical",
    companies.length,
    companies.filter(hasBadCoordinate)
  ))

  rules.push(makeRule(
    "uc-content-length",
    "Use cases: content must be at least 500 characters",
    "Use Cases",
    "Validity",
    "critical",
    useCases.length,
    useCases.filter((row) => text(row.content).length < 500),
    (row) => `${text(row.content).length} characters`
  ))

  rules.push(makeRule(
    "company-description-length",
    "Companies: description must be at least 500 characters",
    "Companies",
    "Validity",
    "info",
    companies.length,
    companies.filter((row) => text(row.description).length < 500),
    (row) => `${text(row.description).length} characters`
  ))

  rules.push(makeRule(
    "uc-url-quality",
    "Use cases: URL must be a specific article, case study, press release, or research page",
    "Use Cases",
    "Traceability",
    "critical",
    useCases.length,
    useCases.filter((row) => isBadUseCaseUrl(text(row.URL))),
    (row) => text(row.URL)
  ))

  rules.push(makeRule(
    "uc-navigation-contamination",
    "Use cases: content must not contain navigation, cookie, or HTML contamination",
    "Use Cases",
    "Validity",
    "critical",
    useCases.length,
    useCases.filter((row) => {
      const content = text(row.content)
      return [...NAVIGATION_TERMS, ...HTML_REMNANTS].some((term) => content.includes(term))
    })
  ))

  rules.push(makeRule(
    "uc-generic-marketing",
    "Use cases: content must not be generic AI marketing copy",
    "Use Cases",
    "Validity",
    "warning",
    useCases.length,
    useCases.filter((row) => {
      const content = text(row.content).toLowerCase()
      return GENERIC_MARKETING_PHRASES.some((phrase) => content.includes(phrase.toLowerCase()))
    })
  ))

  rules.push(makeRule(
    "uc-summary-length",
    "Use cases: summary must be at least 200 characters",
    "Use Cases",
    "Validity",
    "warning",
    useCases.length,
    useCases.filter((row) => text(row.summary).length < 200),
    (row) => `${text(row.summary).length} characters`
  ))

  rules.push(makeRule(
    "uc-summary-ellipsis",
    "Use cases: summary should not end with ellipsis",
    "Use Cases",
    "Validity",
    "warning",
    useCases.length,
    useCases.filter((row) => text(row.summary).endsWith("..."))
  ))

  rules.push(makeRule(
    "uc-status",
    "Use cases: status must be published",
    "Use Cases",
    "Validity",
    "critical",
    useCases.length,
    useCases.filter((row) => text(row.status) !== "published"),
    (row) => `status=${text(row.status) || "(empty)"}`
  ))

  rules.push(makeRule(
    "uc-type",
    "Use cases: type must be Deployment, Experiment, or Research",
    "Use Cases",
    "Validity",
    "critical",
    useCases.length,
    useCases.filter((row) => !["Deployment", "Experiment", "Research"].includes(text(row.type))),
    (row) => `type=${text(row.type) || "(empty)"}`
  ))

  rules.push(makeRule(
    "uc-continent",
    "Use cases: continent must be a valid continent",
    "Use Cases",
    "Validity",
    "critical",
    useCases.length,
    useCases.filter((row) => !VALID_CONTINENTS.has(text(row.continent))),
    (row) => `continent=${text(row.continent) || "(empty)"}`
  ))

  rules.push(makeRule(
    "uc-country-continent",
    "Use cases: continent must match standardized country",
    "Use Cases",
    "Consistency",
    "warning",
    useCases.length,
    useCases.filter((row) => {
      const expected = COUNTRY_CONTINENT[text(row.country)]
      return Boolean(expected && expected !== text(row.continent))
    }),
    (row) => `country=${text(row.country)}, continent=${text(row.continent)}`
  ))

  rules.push(makeRule(
    "uc-industry-gics",
    "Use cases: industry must be approved GICS Level 3 or Research Institution",
    "Use Cases",
    "Validity",
    "warning",
    useCases.length,
    useCases.filter((row) => !VALID_GICS_NORMALIZED.has(normalizeTaxonomyValue(row.industry))),
    (row) => text(row.industry) || "(empty)"
  ))

  rules.push(makeRule(
    "company-industry-gics",
    "Companies: industry must be approved GICS Level 3 or Research Institution",
    "Companies",
    "Validity",
    "warning",
    companies.length,
    companies.filter((row) => !VALID_GICS_NORMALIZED.has(normalizeTaxonomyValue(row.industry))),
    (row) => text(row.industry) || "(empty)"
  ))

  rules.push(makeRule(
    "uc-company-reference",
    "Use cases: company_id must reference an existing company",
    "Use Cases",
    "Consistency",
    "critical",
    useCases.length,
    useCases.filter((row) => isBlank(row.company_id) || !companyIds.has(String(row.company_id))),
    (row) => `company_id=${String(row.company_id ?? "(empty)")}`
  ))

  rules.push(makeRule(
    "uc-company-industry-consistency",
    "Use cases: industry should match the linked company's primary industry",
    "Use Cases",
    "Consistency",
    "warning",
    useCases.length,
    useCases.filter((row) => {
      const company = companyById.get(String(row.company_id))
      return Boolean(
        company &&
        text(company.industry) &&
        text(row.industry) &&
        normalizeTaxonomyValue(company.industry) !== normalizeTaxonomyValue(row.industry)
      )
    }),
    (row) => {
      const company = companyById.get(String(row.company_id))
      return `use case=${text(row.industry)}, company=${text(company?.industry)}`
    }
  ))

  rules.push(makeRule(
    "company-logo-null",
    "Companies: logo_url should remain null",
    "Companies",
    "Validity",
    "info",
    companies.length,
    companies.filter((row) => !isBlank(row.logo_url)),
    (row) => text(row.logo_url)
  ))

  const duplicateUrlSamples = duplicateSamples(useCases, "URL")
  rules.push({
    id: "uc-url-duplicates",
    name: "Use cases: URL must be unique",
    table: "Use Cases",
    dimension: "Uniqueness",
    severity: "critical",
    total: useCases.length,
    failed: duplicateUrlSamples.reduce((sum, item) => sum + Number(item.detail?.split(" ")[0] ?? 0), 0),
    samples: duplicateUrlSamples,
  })

  const duplicateCompanyNameSamples = duplicateSamples(companies, "name")
  rules.push({
    id: "company-name-duplicates",
    name: "Companies: official company name should be unique",
    table: "Companies",
    dimension: "Uniqueness",
    severity: "critical",
    total: companies.length,
    failed: duplicateCompanyNameSamples.reduce((sum, item) => sum + Number(item.detail?.split(" ")[0] ?? 0), 0),
    samples: duplicateCompanyNameSamples,
  })

  const tableScore = (table: RuleResult["table"]) => {
    const tableRules = rules.filter((rule) => rule.table === table)
    let weightedScore = 0
    let totalWeight = 0

    for (const rule of tableRules) {
      if (rule.total <= 0) continue
      const weight = SEVERITY_SCORE_WEIGHTS[rule.severity]
      const failureRate = (rule.failed / rule.total) * 100
      const ruleScore = Math.max(0, 100 - failureRate * SEVERITY_FAILURE_MULTIPLIERS[rule.severity])
      weightedScore += ruleScore * weight
      totalWeight += weight
    }

    if (totalWeight <= 0) return 100

    return roundScore(Math.max(0, weightedScore / totalWeight))
  }

  const useCaseScore = tableScore("Use Cases")
  const companyScore = tableScore("Companies")
  const score = roundScore(useCaseScore * 0.9 + companyScore * 0.1)

  const criticalFailures = rules
    .filter((rule) => rule.severity === "critical")
    .reduce((sum, rule) => sum + rule.failed, 0)
  const warningFailures = rules
    .filter((rule) => rule.severity === "warning")
    .reduce((sum, rule) => sum + rule.failed, 0)
  const infoFailures = rules
    .filter((rule) => rule.severity === "info")
    .reduce((sum, rule) => sum + rule.failed, 0)

  const response = {
    generatedAt: new Date().toISOString(),
    elapsedMs: Math.round(performance.now() - started),
    score,
    scores: {
      overall: score,
      useCases: useCaseScore,
      companies: companyScore,
      weights: {
        useCases: 90,
        companies: 10,
      },
    },
    totals: {
      useCases: useCases.length,
      companies: companies.length,
      criticalFailures,
      warningFailures,
      infoFailures,
    },
    rules,
    distributions: {
      useCaseIndustry: countBy(useCases, "industry").slice(0, 15),
      useCaseCountry: countBy(useCases, "country").slice(0, 15),
      useCaseContinent: countBy(useCases, "continent"),
      companyIndustry: countBy(companies, "industry").slice(0, 15),
      companyCountry: countBy(companies, "headquarters_country").slice(0, 15),
      sourceDomain: countByDomain(useCases).slice(0, 15),
      useCaseType: countBy(useCases, "type"),
    },
  }

  return NextResponse.json(response)
}
