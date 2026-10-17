import { NextResponse, type NextRequest } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export const dynamic = "force-dynamic"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BOT_RE = /bot|crawler|spider|HeadlessChrome|Lighthouse/i

/** One row per browser per day; repeat pings the same day are ignored. */
export async function POST(request: NextRequest) {
  if (BOT_RE.test(request.headers.get("user-agent") ?? "")) {
    return new NextResponse(null, { status: 204 })
  }

  let body: { id?: unknown; path?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const id = typeof body.id === "string" ? body.id : ""
  const path = typeof body.path === "string" ? body.path.slice(0, 200) : ""
  if (!UUID_RE.test(id) || !path.startsWith("/") || path.startsWith("/admin")) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  if (!supabase) return new NextResponse(null, { status: 204 })

  const { error } = await supabase.from("AI_Atlas_Visits").upsert(
    {
      visitor_id: id,
      day: new Date().toISOString().slice(0, 10),
      first_path: path,
      country: request.headers.get("x-vercel-ip-country"),
    },
    { onConflict: "visitor_id,day", ignoreDuplicates: true },
  )
  if (error) console.error("[visit] insert failed:", error.message)

  return new NextResponse(null, { status: 204 })
}
