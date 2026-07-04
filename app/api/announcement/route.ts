import { NextResponse } from "next/server"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readAnnouncementFile(): string {
  try {
    // /tmp/ on Vercel serverless; project-root data/ on local dev
    const local = join(process.cwd(), "data", "announcement.txt")
    return readFileSync(local, "utf-8").trim()
  } catch {
    try {
      return readFileSync("/tmp/announcement.txt", "utf-8").trim()
    } catch {
      return ""
    }
  }
}

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(
    { content: readAnnouncementFile() },
    { headers: { "Cache-Control": "no-cache" } },
  )
}
