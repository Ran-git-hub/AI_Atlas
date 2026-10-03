"use client"

import dynamic from "next/dynamic"
import type { BeforeSendEvent } from "@vercel/analytics"

/** Load only on the client to avoid SSR/client HTML drift from analytics + metadata streaming. */
const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((m) => m.Analytics),
  { ssr: false }
)

const OPT_OUT_KEY = "va-disable"

/**
 * Keep the owner's own traffic and headless crawlers out of Web Analytics.
 * - Automated browsers (navigator.webdriver, HeadlessChrome UA) are not reported.
 * - /admin pages are never reported.
 * - Visiting /admin once marks this browser as the owner's, so later
 *   front-end browsing from the same browser is not reported either.
 * Undo in the browser console: localStorage.removeItem("va-disable")
 */
function isAutomatedBrowser(): boolean {
  try {
    if (navigator.webdriver) return true
    return /HeadlessChrome|Lighthouse|bot|crawler|spider/i.test(navigator.userAgent)
  } catch {
    return false
  }
}

function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  // Headless/automated browsers (crawlers that run JS) are not real visitors.
  if (isAutomatedBrowser()) return null

  let path = ""
  try {
    path = new URL(event.url).pathname
  } catch {
    return event
  }

  if (path.startsWith("/admin")) {
    try {
      localStorage.setItem(OPT_OUT_KEY, "true")
    } catch {}
    return null
  }

  try {
    if (localStorage.getItem(OPT_OUT_KEY) === "true") return null
  } catch {}

  return event
}

export function ClientAnalytics() {
  return <Analytics beforeSend={beforeSend} />
}
