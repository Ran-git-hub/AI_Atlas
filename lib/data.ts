import { createClient } from "@/lib/supabase/server"
import { Company, CountryData, COUNTRY_COORDINATES } from "./types"

export async function getCompanies(): Promise<Company[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("AI_Atlas_Companies")
    .select("*")
    .order("headquarters_country")
  
  if (error) {
    console.error("Error fetching companies:", error)
    return []
  }
  
  return data || []
}

export async function getCompaniesByCountry(): Promise<CountryData[]> {
  const companies = await getCompanies()
  
  // Group companies by country
  const countryMap = new Map<string, Company[]>()
  
  for (const company of companies) {
    const country = company.headquarters_country
    if (!countryMap.has(country)) {
      countryMap.set(country, [])
    }
    countryMap.get(country)!.push(company)
  }
  
  // Convert to CountryData array with coordinates
  const countryData: CountryData[] = []
  
  for (const [country, companiesList] of countryMap) {
    const coords = COUNTRY_COORDINATES[country] || { lat: 0, lng: 0 }
    countryData.push({
      country,
      lat: coords.lat,
      lng: coords.lng,
      companies: companiesList
    })
  }
  
  return countryData
}

export async function getCompaniesForCountry(country: string): Promise<Company[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("AI_Atlas_Companies")
    .select("*")
    .eq("headquarters_country", country)
    .order("name")
  
  if (error) {
    console.error("Error fetching companies for country:", error)
    return []
  }
  
  return data || []
}
