"use client"

import { useEffect } from "react"
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

const VISITOR_ID_KEY = "atlas-visitor-id"
const VISITOR_PING_KEY = "atlas-visitor-ping"

/** Record this browser once per UTC day in our own table (see /api/visit). */
function recordVisit() {
  try {
    const path = window.location.pathname
    if (path.startsWith("/admin")) return
    if (isAutomatedBrowser()) return
    if (localStorage.getItem(OPT_OUT_KEY) === "true") return

    const today = new Date().toISOString().slice(0, 10)
    if (localStorage.getItem(VISITOR_PING_KEY) === today) return

    let id = localStorage.getItem(VISITOR_ID_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(VISITOR_ID_KEY, id)
    }
    localStorage.setItem(VISITOR_PING_KEY, today)
    void fetch("/api/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, path }),
      keepalive: true,
    }).catch(() => {})
  } catch {}
}

export function ClientAnalytics() {
  useEffect(recordVisit, [])
  return <Analytics beforeSend={beforeSend} />
}
