import { NextResponse } from "next/server"
import { updateAnnouncementContent } from "@/lib/data-announcement"

export async function PATCH(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const content = typeof body.content === "string" ? body.content : ""
  const result = await updateAnnouncementContent(content)
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
