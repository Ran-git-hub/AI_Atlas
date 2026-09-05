const FALLBACK_SITE_URL = "https://ai-atlas.app"

/**
 * Origin for absolute URLs (canonical tags, OG metadata, share intents).
 *
 * Only NEXT_PUBLIC_* is inlined into client bundles, so the VERCEL_* branches
 * resolve server-side only. Call this during render on the server and pass the
 * result down — calling it while rendering a client component risks the two
 * sides disagreeing on the origin and failing hydration.
 */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    FALLBACK_SITE_URL
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return withProtocol.replace(/\/+$/, "")
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`
}

/**
 * Canonical origin that resolves identically on server and client, for client
 * components that build absolute URLs during render. Deliberately ignores the
 * VERCEL_* branches: they're server-only, so including them would let the two
 * sides disagree. Share links should point at the public site anyway, never at
 * localhost or a preview host.
 */
export function publicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return withProtocol.replace(/\/+$/, "")
}

export function publicAbsoluteUrl(path: string): string {
  return `${publicSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`
}
