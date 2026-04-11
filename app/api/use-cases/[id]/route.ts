import { NextResponse } from "next/server"
import { getUseCaseCatalogRowById } from "@/lib/data"

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
