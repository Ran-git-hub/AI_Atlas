import { NextResponse } from "next/server"
import { updateNewsStatus } from "@/lib/data-news"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const status = typeof body.status === "string" ? body.status.trim() : ""
  if (!status) {
    return NextResponse.json({ ok: false, error: "Missing status" }, { status: 400 })
  }

  const result = await updateNewsStatus(id, status)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
