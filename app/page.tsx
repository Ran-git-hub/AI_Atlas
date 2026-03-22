import { getCompaniesWithCoords, getUseCasesWithCoords } from "@/lib/data"
import { HomeClient } from "@/components/home-client"

export default async function Home() {
  const [companies, useCases] = await Promise.all([
    getCompaniesWithCoords(),
    getUseCasesWithCoords(),
  ])

  return <HomeClient companies={companies} useCases={useCases} />
}
