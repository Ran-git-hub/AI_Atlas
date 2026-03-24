import {
  getCompaniesWithCoords,
  getLatestAtlasDataUpdateCetDisplay,
  getUseCasesWithCoords,
} from "@/lib/data"
import { HomeClient } from "@/components/home-client"

export default async function Home() {
  const [companies, useCases, latestDataUpdateCet] = await Promise.all([
    getCompaniesWithCoords(),
    getUseCasesWithCoords(),
    getLatestAtlasDataUpdateCetDisplay(),
  ])

  return (
    <HomeClient
      companies={companies}
      useCases={useCases}
      latestDataUpdateCet={latestDataUpdateCet}
    />
  )
}
