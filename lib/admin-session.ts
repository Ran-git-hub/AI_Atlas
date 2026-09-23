import { cookies } from "next/headers"
import { verifyAdminToken } from "@/lib/admin-auth"

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
