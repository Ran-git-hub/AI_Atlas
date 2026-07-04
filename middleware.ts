import { NextResponse, type NextRequest } from "next/server"
import { verifyAdminToken } from "@/lib/admin-auth"

// Routes that are publicly accessible without a session.
const PUBLIC_PREFIXES = ["/admin/login", "/api/admin/login"]

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

  // PATCH /api/use-cases/* and /api/admin/* require a valid session cookie.
  if (
    (pathname.startsWith("/api/use-cases") || pathname.startsWith("/api/admin")) &&
    request.method === "PATCH"
  ) {
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
