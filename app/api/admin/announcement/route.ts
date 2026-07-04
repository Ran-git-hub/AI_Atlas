import { NextResponse } from "next/server"
import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

async function writeAnnouncementFile(content: string) {
  const text = content.trim()

  // Try project-root data/ directory first (local dev)
  try {
    const dir = join(process.cwd(), "data")
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "announcement.txt"), text, "utf-8")
    return { ok: true }
  } catch {
    // Fallback to /tmp/ (Vercel serverless)
    try {
      writeFileSync("/tmp/announcement.txt", text, "utf-8")
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  }
}

export async function PATCH(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const content = typeof body.content === "string" ? body.content : ""
  const result = await writeAnnouncementFile(content)
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
