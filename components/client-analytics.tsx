"use client"

import dynamic from "next/dynamic"

/** Load only on the client to avoid SSR/client HTML drift from analytics + metadata streaming. */
const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((m) => m.Analytics),
  { ssr: false }
)

export function ClientAnalytics() {
  return <Analytics />
}
