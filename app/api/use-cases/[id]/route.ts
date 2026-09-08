import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { revalidatePath, revalidateTag } from "next/cache"
import { verifyAdminToken } from "@/lib/admin-auth"
import { CACHE_TAGS, CACHE_TAG_LIFE } from "@/lib/cache-tags"
import { getUseCaseCatalogRowById, updateUseCaseStatus } from "@/lib/data"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params
  const id = decodeURIComponent(rawId ?? "").trim()
  if (!id) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 })
  }

  // The admin detail modal loads its field entries from here. Archived rows
  // are hidden from the public catalog, so without this an archived case
  // opened in /admin/use-cases got a 404 and rendered an empty panel.
  const token = (await cookies()).get("admin_session")?.value
  const isAdmin = token ? Boolean(await verifyAdminToken(token)) : false

  const row = await getUseCaseCatalogRowById(id, { includeArchived: isAdmin })
  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  return NextResponse.json(row)
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params
  const id = decodeURIComponent(rawId ?? "").trim()
  if (!id) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 })
  }

  const status = typeof body === "object" && body !== null && "status" in body
    ? String((body as { status: unknown }).status ?? "").trim()
    : ""

  if (!status) {
    return NextResponse.json({ ok: false, error: "missing_status" }, { status: 400 })
  }

  const result = await updateUseCaseStatus(id, status)
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 })
  }

  // revalidatePath only drops the route cache. The data these pages render
  // comes from tagged caches, which it does not touch - without this an edit
  // waited out the timer.
  revalidateTag(CACHE_TAGS.useCases, CACHE_TAG_LIFE)
  revalidatePath("/use-cases")
  revalidatePath("/admin/use-cases")

  return NextResponse.json({ ok: true, status: result.status })
}
