import { QualityDashboard } from "./quality-dashboard"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Data Quality - AI Atlas",
  description: "Live AI Atlas data quality dashboard",
}

export default function QualityPage() {
  return <QualityDashboard />
}
