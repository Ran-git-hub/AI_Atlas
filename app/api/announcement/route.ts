import { NextResponse } from "next/server"
import { getCachedAnnouncementContent } from "@/lib/data-announcement"

/**
 * Read by AnnouncementBar, which the root layout mounts on every page, so this
 * ran once per page load anywhere on the site. It was force-dynamic and sent
 * `Cache-Control: no-cache`, so every one of those was a function invocation in
 * iad1 plus a Supabase round trip to eu-central-2 - measured at 0.47-0.88s to
 * return 14 bytes, usually `{"content":""}`.
 *
 * Cached instead, so the edge answers and no function runs. PATCH on
 * /api/admin/announcement purges the tag, so a saved announcement is live at
 * once and the timer below only covers a row edited straight in Supabase.
 *
 * A short timer would be the obvious alternative and is the expensive one: at
 * revalidate 60 the route regenerates up to 1440 times a day, and ISR write
 * units are at 177,505 of 200,000. Purging on write costs a write per actual
 * change instead - a handful a month.
 */
export const revalidate = 86400

export async function GET() {
  const content = await getCachedAnnouncementContent()
  return NextResponse.json({ content })
}
