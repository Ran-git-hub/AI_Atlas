import { getCompaniesByCountry } from "@/lib/data"
import { HomeClient } from "@/components/home-client"

export default async function Home() {
  const countries = await getCompaniesByCountry()
  
  return <HomeClient countries={countries} />
}
