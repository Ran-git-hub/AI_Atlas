import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
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

  const row = await getUseCaseCatalogRowById(id)
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

  revalidatePath("/use-cases")
  revalidatePath("/admin/use-cases")

  return NextResponse.json({ ok: true, status: result.status })
}
