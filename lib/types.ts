// Company data from AI_Atlas_Companies table
export interface Company {
  id: string
  name: string
  description: string
  industry: string
  website_url: string
  logo_url: string
  headquarters_country: string
  city: string
  created_at: string
  updated_at?: string | null
}

// Company with coordinates for the globe
export interface CompanyWithCoords extends Company {
  lat: number
  lng: number
}

// Use cases from AI_Atlas_Use_Cases (coordinates from DB; names may vary per column)
export interface UseCaseFieldEntry {
  key: string
  label: string
  value: string
}

export interface UseCase {
  id: string
  company_id?: string | null
  title?: string | null
  name?: string | null
  description?: string | null
  sector?: string | null
  industry?: string | null
  city?: string | null
  country?: string | null
  location?: string | null
  company_name?: string | null
  website_url?: string | null
  reference_url?: string | null
  url?: string | null
  image_url?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface UseCaseWithCoords extends UseCase {
  lat: number
  lng: number
  /** One entry per DB column (stable order) for the detail panel */
  fieldEntries: UseCaseFieldEntry[]
}

export interface UseCaseCatalogRow extends UseCase {
  lat?: number | null
  lng?: number | null
  /** One entry per DB column (stable order) for table details/expansion */
  fieldEntries: UseCaseFieldEntry[]
}

export function useCaseDisplayName(u: UseCase): string {
  const t = u.title?.trim() || u.name?.trim()
  return t || "Use case"
}

// City coordinates mapping
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // USA
  "Salt Lake City": { lat: 40.7608, lng: -111.8910 },
  "Santa Clara": { lat: 37.3541, lng: -121.9552 },
  "New York": { lat: 40.7128, lng: -74.0060 },
  "Scottsdale": { lat: 33.4942, lng: -111.9261 },
  "Boston": { lat: 42.3601, lng: -71.0589 },
  "San Francisco": { lat: 37.7749, lng: -122.4194 },
  "Seattle": { lat: 47.6062, lng: -122.3321 },
  "Austin": { lat: 30.2672, lng: -97.7431 },
  "Los Angeles": { lat: 34.0522, lng: -118.2437 },
  "Chicago": { lat: 41.8781, lng: -87.6298 },
  "Mountain View": { lat: 37.3861, lng: -122.0839 },
  "Palo Alto": { lat: 37.4419, lng: -122.1430 },
  "Menlo Park": { lat: 37.4530, lng: -122.1817 },
  
  // UK
  "London": { lat: 51.5074, lng: -0.1278 },
  "Oxford": { lat: 51.7520, lng: -1.2577 },
  "Cambridge": { lat: 52.2053, lng: 0.1218 },
  "Edinburgh": { lat: 55.9533, lng: -3.1883 },
  "Manchester": { lat: 53.4808, lng: -2.2426 },

  // Norway
  "Moss": { lat: 59.4344, lng: 10.6577 },
  
  // Israel
  "Tel Aviv": { lat: 32.0853, lng: 34.7818 },
  "Jerusalem": { lat: 31.7683, lng: 35.2137 },
  "Haifa": { lat: 32.7940, lng: 34.9896 },
  
  // China/Hong Kong
  "Hong Kong": { lat: 22.3193, lng: 114.1694 },
  "Beijing": { lat: 39.9042, lng: 116.4074 },
  "Shanghai": { lat: 31.2304, lng: 121.4737 },
  "Shenzhen": { lat: 22.5431, lng: 114.0579 },
  "Hangzhou": { lat: 30.2741, lng: 120.1551 },
  
  // Germany
  "Berlin": { lat: 52.5200, lng: 13.4050 },
  "Munich": { lat: 48.1351, lng: 11.5820 },
  "Frankfurt": { lat: 50.1109, lng: 8.6821 },
  
  // France
  "Paris": { lat: 48.8566, lng: 2.3522 },
  
  // Canada
  "Toronto": { lat: 43.6532, lng: -79.3832 },
  "Montreal": { lat: 45.5017, lng: -73.5673 },
  "Vancouver": { lat: 49.2827, lng: -123.1207 },
  
  // Japan
  "Tokyo": { lat: 35.6762, lng: 139.6503 },
  "Osaka": { lat: 34.6937, lng: 135.5023 },
  
  // South Korea
  "Seoul": { lat: 37.5665, lng: 126.9780 },
  
  // India
  "Bangalore": { lat: 12.9716, lng: 77.5946 },
  "Mumbai": { lat: 19.0760, lng: 72.8777 },
  "Delhi": { lat: 28.7041, lng: 77.1025 },
  
  // Australia
  "Sydney": { lat: -33.8688, lng: 151.2093 },
  "Melbourne": { lat: -37.8136, lng: 144.9631 },
  
  // Singapore
  "Singapore": { lat: 1.3521, lng: 103.8198 },
  
  // Netherlands
  "Amsterdam": { lat: 52.3676, lng: 4.9041 },
  
  // Sweden
  "Stockholm": { lat: 59.3293, lng: 18.0686 },
  
  // Switzerland
  "Zurich": { lat: 47.3769, lng: 8.5417 },
  "Geneva": { lat: 46.2044, lng: 6.1432 },
}
