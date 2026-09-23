import path from "node:path"
import { fileURLToPath } from "node:url"

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Dev-only: allow loading `_next` assets when you open the site by LAN IP
   * (e.g. http://192.168.0.200:3000) instead of localhost. Without this, Next can
   * block those requests and client-side dynamic imports never finish → stuck on
   * "Loading Globe..." on phone/tablet.
   *
   * Default is localhost only. For LAN testing, set e.g.:
   *   NEXT_DEV_LAN_ORIGINS=localhost,127.0.0.1,192.168.0.200
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
   */
  allowedDevOrigins: (process.env.NEXT_DEV_LAN_ORIGINS ?? "localhost,127.0.0.1")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  /**
   * /sitemap.xml is a rewrite, not a route.
   *
   * Every previous shape of this route - Next's native app/sitemap.ts, then a
   * route handler at app/sitemap.xml/route.ts - kept disappearing from the
   * deployed build, leaving /sitemap.xml serving the static 404 page while it
   * worked locally. A rewrite is resolved by the routing layer rather than by
   * Next's metadata route handling, so the handler is an ordinary API route
   * with an ordinary name.
   *
   * Googlebot only ever requests /sitemap.xml, so robots.txt's Disallow: /api/
   * does not apply to the rewrite target.
   */
  async rewrites() {
    return [{ source: "/sitemap.xml", destination: "/api/sitemap" }]
  },

  /**
   * Baseline security headers on every response.
   *
   * - X-Frame-Options: DENY - no other site may embed these pages, which is
   *   what keeps /admin from being framed and clicked through (clickjacking).
   * - X-Content-Type-Options: nosniff - the browser uses the declared type
   *   rather than guessing one from the bytes.
   * - Referrer-Policy - an outbound click sends the origin, not the full path
   *   with its query string.
   *
   * No Content-Security-Policy yet. The methodology page starts its behaviour
   * with `new Function`, so a CSP would need 'unsafe-eval' and lose most of its
   * value, and the globe, Vercel Analytics and inline styles each need their
   * own allowances - worth its own change, verified page by page.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ]
  },
}

export default nextConfig
