import { NextResponse, type NextRequest } from "next/server"
import { verifyAdminToken } from "@/lib/admin-auth"
import { hasMachineToken } from "@/lib/machine-auth"

// Routes that are publicly accessible without a session.
// Logging out without a session is a no-op, so it does not need one.
const PUBLIC_PREFIXES = ["/admin/login", "/api/admin/login", "/api/admin/logout"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login-related routes through without auth.
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // All other /admin/* routes require a valid session cookie.
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin_session")?.value
    const username = token ? await verifyAdminToken(token) : null
    if (username) return NextResponse.next()
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  // Every /api/admin/* request needs a session, whatever the method: these
  // routes read and write operator-only data. Guarding PATCH alone left any
  // GET or POST under /api/admin open.
  // /api/use-cases/* stays PATCH-only — its GET serves the public site.
  const needsSession =
    pathname.startsWith("/api/admin") ||
    (pathname.startsWith("/api/use-cases") && request.method === "PATCH")

  if (needsSession) {
    // The weekly ops writer is a cron, not a browser: it presents the shared
    // machine token instead of a session cookie.
    if (hasMachineToken(request.headers.get("authorization"))) {
      return NextResponse.next()
    }
    const token = request.cookies.get("admin_session")?.value
    const username = token ? await verifyAdminToken(token) : null
    if (username) return NextResponse.next()
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/use-cases/:path*", "/api/admin/:path*"],
}
