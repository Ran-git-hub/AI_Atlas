import { getCachedLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import { QualityDashboard } from "./quality-dashboard"
import { pageMetadata } from "@/lib/page-metadata"

export const dynamic = "force-dynamic"

export const metadata = pageMetadata({
  title: "Data Quality - AI Atlas",
  description: "Live AI Atlas data quality dashboard",
  path: "/quality",
})

export default async function QualityPage() {
  const latestDataUpdateCet = await getCachedLatestAtlasDataUpdateCetDisplay()

  return <QualityDashboard latestDataUpdateCet={latestDataUpdateCet} />
}
