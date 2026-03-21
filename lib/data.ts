import { createClient } from "@/lib/supabase/server"
import { Company, CompanyWithCoords, CITY_COORDINATES } from "./types"

export async function getCompanies(): Promise<Company[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("AI_Atlas_Companies")
    .select("*")
    .order("name")
  
  if (error) {
    console.error("Error fetching companies:", error)
    return []
  }
  
  return data || []
}

export async function getCompaniesWithCoords(): Promise<CompanyWithCoords[]> {
  const companies = await getCompanies()
  
  return companies.map(company => {
    const coords = CITY_COORDINATES[company.city] || { lat: 0, lng: 0 }
    return {
      ...company,
      lat: coords.lat,
      lng: coords.lng
    }
  })
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("AI_Atlas_Companies")
    .select("*")
    .eq("id", id)
    .single()
  
  if (error) {
    console.error("Error fetching company:", error)
    return null
  }
  
  return data
}
