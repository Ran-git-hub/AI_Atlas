// TEMPORARY no-op middleware for diagnostic purposes.
// The hypothesis being tested: the deprecated `middleware` filename in
// Next.js 16 is breaking metadata-route generation on Vercel's cloud
// build. The original /admin Basic Auth logic is preserved in
// /Users/clawclaw/.openclaw/workspace-ai-atlas/tmp/middleware.ts.backup
// and will be restored (renamed to proxy.ts) after this test confirms
// the diagnosis.
//
// DO NOT keep this file in production past the diagnostic. While this
// is deployed, /admin is publicly accessible (no auth).

import { NextResponse, type NextRequest } from "next/server"

export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/use-cases/:path*"],
}
