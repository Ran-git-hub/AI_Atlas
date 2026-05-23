import { QualityDashboard } from "./quality-dashboard"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Data Quality - AI Atlas",
  description: "AI Atlas database health and data quality dashboard",
}

export default function QualityPage() {
  return <QualityDashboard />
}
