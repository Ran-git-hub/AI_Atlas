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
}

export default nextConfig
