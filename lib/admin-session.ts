import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { verifyAdminToken } from "@/lib/admin-auth"
import { hasMachineToken } from "@/lib/machine-auth"

/**
 * Whether the current request carries a valid admin session.
 *
 * For server components and route handlers outside /admin, which middleware
 * does not guard, that show more to the operator than to the public -
 * unpublished cases, for one. Reading cookies makes the caller dynamic.
 */
export async function hasAdminSession(): Promise<boolean> {
  const token = (await cookies()).get("admin_session")?.value
  return token ? Boolean(await verifyAdminToken(token)) : false
}

/*
 * The two guards below repeat, inside each admin route and page, the check
 * middleware.ts already makes. Middleware was the only gate, and Next.js has
 * shipped more than one middleware bypass - 16.2.0 carried one - so a bypass
 * alone must not reach operator data or writes. They accept exactly what
 * middleware accepts, no more and no less.
 */

/**
 * For /api/admin/* handlers and PATCH /api/use-cases/*: null when the request
 * may proceed, otherwise the 401 to return. Like middleware, it accepts the
 * weekly-ops cron's machine token as well as an admin session.
 */
export async function requireAdminApi(request: Request): Promise<NextResponse | null> {
  if (hasMachineToken(request.headers.get("authorization"))) return null
  if (await hasAdminSession()) return null
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
}

/** For server-rendered /admin pages: redirects to the login page without a session. */
export async function requireAdminPage(): Promise<void> {
  if (!(await hasAdminSession())) redirect("/admin/login")
}
