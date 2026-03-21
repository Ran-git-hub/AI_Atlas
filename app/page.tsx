import { getCompaniesByCountry } from "@/lib/data"
import { HomeClient } from "@/components/home-client"

export default async function Home() {
  const countries = await getCompaniesByCountry()
  
  console.log("[v0] Server: countries data:", JSON.stringify(countries, null, 2))
  
  return <HomeClient countries={countries} />
}
