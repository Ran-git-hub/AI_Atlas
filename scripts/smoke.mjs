// Checks a running site for failures that return 200 and look fine:
// unpublished cases leaking into public pages, the sitemap silently losing
// rows, and made-up weekly posts. Run by hand after a deploy or a data change.
//
// Usage: node scripts/smoke.mjs [baseUrl]   (default http://localhost:3000)
// Point it at a production build (npm run build && npm start) or the live
// site: `next dev` serves a stub weekly post on purpose, so that check fails.
//
// Reads NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and
// SUPABASE_SERVICE_ROLE_KEY from the environment or .env.local. The service key
// is only used to list unpublished ids, which anon cannot see.
import fs from "node:fs"

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "")

const env = { ...process.env }
if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m && env[m[1]] === undefined) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "")
  }
}
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !anonKey || !serviceKey) {
  console.error("Missing Supabase URL, anon key or service role key.")
  process.exit(2)
}

async function rest(table, query, key, { count = false } = {}) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    method: count ? "HEAD" : "GET",
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...(count ? { Prefer: "count=exact" } : {}) },
  })
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`)
  return count ? Number(res.headers.get("content-range")?.split("/")[1]) : res.json()
}

async function page(path) {
  const res = await fetch(base + path, { redirect: "manual" })
  return { status: res.status, text: await res.text() }
}

const failures = []
const check = (ok, message) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${message}`)
  if (!ok) failures.push(message)
}

const unpublished = await rest(
  "AI_Atlas_Use_Cases",
  "select=id&status=neq.published&order=created_at.desc&limit=200",
  serviceKey,
)
const unpublishedIds = unpublished.map((row) => String(row.id))
const publishedCases = await rest("AI_Atlas_Use_Cases", "select=id&status=eq.published", anonKey, { count: true })
const publicPosts = await rest("AI_Atlas_Blog_Posts", "select=id", anonKey, { count: true })

const leaks = (text) => unpublishedIds.filter((id) => text.includes(id))

const sitemap = await page("/sitemap.xml")
const caseUrls = sitemap.text.match(/\/use-cases\/[^<]+</g) ?? []
const postUrls = sitemap.text.match(/\/blog\/[^<]+</g) ?? []
check(sitemap.status === 200, `/sitemap.xml returns 200 (got ${sitemap.status})`)
check(caseUrls.length === publishedCases, `sitemap lists every published case (${caseUrls.length} of ${publishedCases})`)
check(postUrls.length === publicPosts, `sitemap lists every public blog post (${postUrls.length} of ${publicPosts})`)
check(leaks(sitemap.text).length === 0, `sitemap has no unpublished case (${leaks(sitemap.text).join(", ") || "none"})`)

for (const path of ["/", "/use-cases"]) {
  const res = await page(path)
  const found = leaks(res.text)
  check(res.status === 200 && found.length === 0, `${path} shows no unpublished case (${found.join(", ") || "none"})`)
}

for (const id of unpublishedIds.slice(0, 3)) {
  // app/use-cases/loading.tsx streams this route, so notFound() arrives after a
  // 200 has been sent. The 404 body is what matters for a leak.
  const detail = await page(`/use-cases/${id}`)
  const hidden = detail.status === 404 || detail.text.includes("NEXT_HTTP_ERROR_FALLBACK;404")
  const soft = detail.status === 200 && hidden ? " - soft 404, status 200" : ""
  check(hidden, `/use-cases/${id} (unpublished) is hidden from the public (got ${detail.status}${soft})`)
  const api = await page(`/api/use-cases/${id}`)
  check(api.status === 404, `/api/use-cases/${id} (unpublished) is 404 for the public (got ${api.status})`)
}

const fakeWeekly = await page("/blog/weekly-2099-01-01")
check(fakeWeekly.status === 404, `/blog/weekly-2099-01-01 is 404, not a made-up report (got ${fakeWeekly.status})`)

console.log(failures.length === 0 ? `\nAll checks passed against ${base}.` : `\n${failures.length} check(s) failed against ${base}.`)
process.exit(failures.length === 0 ? 0 : 1)
