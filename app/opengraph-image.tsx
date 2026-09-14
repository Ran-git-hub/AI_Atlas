import { ImageResponse } from "next/og"
import { OgSiteCard } from "@/components/og-site-card"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "AI Atlas — Real-world AI deployments worldwide"

export default function Image() {
  return new ImageResponse(<OgSiteCard height={size.height} />, { ...size })
}
