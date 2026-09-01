import { NextResponse } from "next/server"
import { getAnnouncementContent } from "@/lib/data-announcement"

export const dynamic = "force-dynamic"

export async function GET() {
  const content = await getAnnouncementContent()
  return NextResponse.json(
    { content },
    { headers: { "Cache-Control": "no-cache" } },
  )
}
