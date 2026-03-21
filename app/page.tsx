import { getCompaniesWithCoords } from "@/lib/data"
import { HomeClient } from "@/components/home-client"

export default async function Home() {
  const companies = await getCompaniesWithCoords()
  
  return <HomeClient companies={companies} />
}
