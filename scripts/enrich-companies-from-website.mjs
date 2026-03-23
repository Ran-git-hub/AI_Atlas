import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_ANON_KEY)) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL and auth key (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)"
  )
  process.exit(1)
}

const activeKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY not found, using anon key (updates may fail due to RLS).")
}

const supabase = createClient(SUPABASE_URL, activeKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const MAX_DESC_CHARS = 220
const MIN_DESC_CHARS = 140
const USER_AGENT =
  "Mozilla/5.0 (compatible; AI-Atlas-Enricher/1.0; +https://example.com/bot)"

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function norm(v) {
  if (v === null || v === undefined) return ""
  return String(v).replace(/\s+/g, " ").trim()
}

function toRootUrl(rawUrl) {
  const raw = norm(rawUrl)
  if (!raw) return ""
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const u = new URL(withProtocol)
    return `https://${u.hostname}`
  } catch {
    return ""
  }
}

async function fetchText(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    })
    if (!res.ok) return ""
    const text = await res.text()
    return text || ""
  } catch {
    return ""
  } finally {
    clearTimeout(timer)
  }
}

function homepageCandidates(rootUrl) {
  if (!rootUrl) return []
  let host = ""
  try {
    host = new URL(rootUrl).hostname
  } catch {
    return [rootUrl]
  }
  const noWww = host.replace(/^www\./i, "")
  const withWww = host.startsWith("www.") ? host : `www.${host}`
  return [
    `https://${host}`,
    `https://${withWww}`,
    `https://${noWww}`,
    `https://${host}/about`,
    `https://${host}/about-us`,
    `https://${host}/company`,
  ]
}

async function fetchWebsiteBestEffort(rootUrl) {
  const tried = new Set()
  for (const c of homepageCandidates(rootUrl)) {
    if (!c || tried.has(c)) continue
    tried.add(c)
    const html = await fetchText(c)
    if (html) return { html, finalUrl: c }
  }
  return { html: "", finalUrl: rootUrl }
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
}

function pickMetaDescription(html) {
  const m =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
  return m ? norm(m[1]) : ""
}

function pickTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return m ? norm(m[1]) : ""
}

function pickJsonLdCity(html) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const s of scripts) {
    const raw = norm(s[1])
    if (!raw) continue
    try {
      const data = JSON.parse(raw)
      const queue = Array.isArray(data) ? [...data] : [data]
      while (queue.length > 0) {
        const cur = queue.shift()
        if (!cur || typeof cur !== "object") continue
        if (cur.address && typeof cur.address === "object") {
          const city = norm(cur.address.addressLocality)
          if (city) return city
        }
        for (const v of Object.values(cur)) {
          if (v && typeof v === "object") queue.push(v)
        }
      }
    } catch {
      // ignore malformed json-ld
    }
  }
  return ""
}

function pickCityFromText(text) {
  const patterns = [
    /\bheadquartered in ([A-Z][A-Za-z.\- ]{1,60})/i,
    /\bbased in ([A-Z][A-Za-z.\- ]{1,60})/i,
    /总部位于([^\s,.;:，。；：]{2,30})/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m && m[1]) {
      return norm(m[1]).replace(/[,.]$/, "")
    }
  }
  return ""
}

function buildChineseDescription(name, title, meta, plainText) {
  const source = meta || plainText.slice(0, 500)
  const core = norm(source).slice(0, 120)
  let desc =
    `${name}是一家专注于技术与产品创新的企业，长期围绕核心业务持续投入，` +
    `通过稳定的产品能力与行业经验为客户提供解决方案。`

  if (core) {
    desc += `官网信息显示，该公司重点方向包括：${core}。`
  }
  if (title) {
    desc += `其品牌定位与价值主张可从“${title}”中得到体现。`
  }
  desc += `整体来看，公司在所在细分领域具备明确的发展策略与执行能力。`

  if (desc.length > MAX_DESC_CHARS) {
    desc = desc.slice(0, MAX_DESC_CHARS)
  }
  if (desc.length < MIN_DESC_CHARS) {
    desc += "公司持续优化产品与服务质量，并通过全球化协作拓展业务边界。"
  }
  return desc
}

async function geocodeCity(city, countryHint = "") {
  const q = norm([city, countryHint].filter(Boolean).join(", "))
  if (!q) return null
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
      signal: controller.signal,
    })
    if (!res.ok) return null
    const arr = await res.json()
    if (!Array.isArray(arr) || arr.length === 0) return null
    const first = arr[0]
    const lat = Number(first.lat)
    const lng = Number(first.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function missingCompanyFields(company) {
  const hasDesc = norm(company.description).length > 0
  const hasCity = norm(company.city).length > 0
  const hasLatLng =
    (company.lat !== null && company.lat !== undefined && String(company.lat) !== "") &&
    (company.lng !== null && company.lng !== undefined && String(company.lng) !== "")
  const hasLatitudeLongitude =
    (company.latitude !== null && company.latitude !== undefined && String(company.latitude) !== "") &&
    (company.longitude !== null && company.longitude !== undefined && String(company.longitude) !== "")
  const hasCoords = hasLatLng || hasLatitudeLongitude
  return { needsDesc: !hasDesc, needsCity: !hasCity, needsCoords: !hasCoords }
}

async function main() {
  const { data: companies, error } = await supabase.from("AI_Atlas_Companies").select("*").order("name")
  if (error) {
    console.error("Failed to read companies:", error)
    process.exit(1)
  }

  const targets = (companies || []).filter((c) => {
    const miss = missingCompanyFields(c)
    return (miss.needsDesc || miss.needsCity || miss.needsCoords) && norm(c.website_url)
  })

  console.log(`Total companies: ${companies.length}`)
  console.log(`Need enrich and have website: ${targets.length}`)

  let success = 0
  let skipped = 0
  const failed = []

  for (const c of targets) {
    const miss = missingCompanyFields(c)
    const website = toRootUrl(c.website_url)
    if (!website) {
      skipped += 1
      continue
    }

    const { html } = await fetchWebsiteBestEffort(website)
    if (!html) {
      failed.push({ id: c.id, name: c.name, reason: "fetch_failed" })
      continue
    }

    const title = pickTitle(html)
    const meta = pickMetaDescription(html)
    const plain = stripHtml(html)
    const cityFromJsonLd = pickJsonLdCity(html)
    const cityFromText = pickCityFromText(`${meta} ${plain.slice(0, 4000)}`)
    const inferredCity = cityFromJsonLd || cityFromText

    const update = {}
    if (miss.needsDesc) {
      update.description = buildChineseDescription(c.name, title, meta, plain)
    }
    if (miss.needsCity && inferredCity) {
      update.city = inferredCity
    }

    let coordCity = miss.needsCity ? (update.city || "") : norm(c.city)
    if (!coordCity) coordCity = inferredCity

    if (miss.needsCoords && coordCity) {
      const geo = await geocodeCity(coordCity, norm(c.headquarters_country))
      if (geo) {
        if ("lat" in c) update.lat = geo.lat
        if ("lng" in c) update.lng = geo.lng
        if ("latitude" in c) update.latitude = geo.lat
        if ("longitude" in c) update.longitude = geo.lng
      }
    }

    if (Object.keys(update).length === 0) {
      skipped += 1
      continue
    }

    const { error: updateError } = await supabase
      .from("AI_Atlas_Companies")
      .update(update)
      .eq("id", c.id)

    if (updateError) {
      failed.push({ id: c.id, name: c.name, reason: updateError.message })
    } else {
      success += 1
      console.log(`Updated: ${c.name}`, update)
    }

    await sleep(450)
  }

  console.log("----- RESULT -----")
  console.log(`Success: ${success}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Failed: ${failed.length}`)
  if (failed.length > 0) {
    console.log("Failed details:", failed.slice(0, 50))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
