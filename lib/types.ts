// Company data from AI_Atlas_Companies table
export interface Company {
  id: string
  name: string
  description: string
  industry: string
  website_url: string
  logo_url: string
  headquarters_country: string
  created_at: string
}

// Country data with coordinates for the globe
export interface CountryData {
  country: string
  lat: number
  lng: number
  companies: Company[]
}

// Country coordinates mapping
export const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "USA": { lat: 37.0902, lng: -95.7129 },
  "UK": { lat: 51.5074, lng: -0.1278 },
  "Israel": { lat: 31.0461, lng: 34.8516 },
  "China/Hong Kong": { lat: 22.3193, lng: 114.1694 },
  "China": { lat: 35.8617, lng: 104.1954 },
  "Hong Kong": { lat: 22.3193, lng: 114.1694 },
  "Germany": { lat: 51.1657, lng: 10.4515 },
  "France": { lat: 46.2276, lng: 2.2137 },
  "Canada": { lat: 56.1304, lng: -106.3468 },
  "Japan": { lat: 36.2048, lng: 138.2529 },
  "South Korea": { lat: 35.9078, lng: 127.7669 },
  "India": { lat: 20.5937, lng: 78.9629 },
  "Australia": { lat: -25.2744, lng: 133.7751 },
  "Singapore": { lat: 1.3521, lng: 103.8198 },
  "Brazil": { lat: -14.2350, lng: -51.9253 },
  "UAE": { lat: 23.4241, lng: 53.8478 },
  "Saudi Arabia": { lat: 23.8859, lng: 45.0792 },
  "Netherlands": { lat: 52.1326, lng: 5.2913 },
  "Sweden": { lat: 60.1282, lng: 18.6435 },
  "Switzerland": { lat: 46.8182, lng: 8.2275 },
}
