import { getLatestAtlasDataUpdateCetDisplay } from "@/lib/data"
import { QualityDashboard } from "./quality-dashboard"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Data Quality - AI Atlas",
  description: "Live AI Atlas data quality dashboard",
}

export default async function QualityPage() {
  const latestDataUpdateCet = await getLatestAtlasDataUpdateCetDisplay()

  return <QualityDashboard latestDataUpdateCet={latestDataUpdateCet} />
}
