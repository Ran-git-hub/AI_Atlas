/**
 * Bearer-token check for callers that are not a browser — the weekly ops cron
 * calling an admin endpoint, for example. Same shared secret and same
 * constant-time comparison the `/api/revalidate` route uses.
 *
 * Runs on the Edge runtime (middleware), so it uses no Node APIs.
 */
export function hasMachineToken(authorization: string | null): boolean {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) return false

  const header = authorization ?? ""
  const provided = header.startsWith("Bearer ") ? header.slice(7) : ""
  if (provided.length !== secret.length) return false

  // Constant-time compare so a wrong secret cannot be found byte by byte.
  let diff = 0
  for (let i = 0; i < secret.length; i++) {
    diff |= secret.charCodeAt(i) ^ provided.charCodeAt(i)
  }
  return diff === 0
}
