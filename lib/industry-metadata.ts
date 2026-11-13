export type IndustryMetadata = {
  shortDescription: string
}

const FALLBACK_METADATA: IndustryMetadata = {
  shortDescription: "Real-world AI deployments tracked across organizations, countries/regions, and use cases.",
}

const INDUSTRY_METADATA: Record<string, IndustryMetadata> = {
  "internet-software-and-services": {
    shortDescription: "Software platforms, cloud products, and digital services using AI in production.",
  },
  "industrial-machinery-and-supplies-and-components": {
    shortDescription: "Industrial systems, equipment makers, and operational technology adopting AI.",
  },
  banks: {
    shortDescription: "Banking deployments spanning automation, fraud, risk, service, and operations.",
  },
  biotechnology: {
    shortDescription: "Biotech organizations using AI across research, discovery, validation, and production.",
  },
  "health-care-providers-and-services": {
    shortDescription: "Care delivery, providers, and health services applying AI to real operational workflows.",
  },
  "health-care-equipment-and-supplies": {
    shortDescription: "Medical equipment and supply organizations embedding AI into products and workflows.",
  },
  "technology-hardware-and-equipment": {
    shortDescription: "Hardware, devices, and infrastructure organizations deploying AI across the stack.",
  },
  "life-sciences-tools-and-services": {
    shortDescription: "Life sciences tools, diagnostics, and services using AI for research and operations.",
  },
  "capital-markets": {
    shortDescription: "Capital markets firms applying AI to analysis, trading, compliance, and operations.",
  },
  "food-beverage-and-tobacco": {
    shortDescription: "Food, beverage, and tobacco organizations applying AI to products, operations, and supply chains.",
  },
  "telecommunication-services": {
    shortDescription: "Telecom operators and services using AI for networks, operations, and customer workflows.",
  },
  "public-administration": {
    shortDescription: "Government and public administration organizations applying AI to public services, operations, and policy workflows.",
  },
  "public-sector-government": {
    shortDescription: "Public sector and government organizations applying AI to services, operations, and civic infrastructure.",
  },
}

export function getIndustryMetadata(slug: string): IndustryMetadata {
  return INDUSTRY_METADATA[slug] ?? FALLBACK_METADATA
}

const INDUSTRY_SEARCH_NAMES: Record<string, string> = {
  banks: "Banking",
  "health-care-providers-and-services": "Healthcare Providers",
  "public-administration": "Government",
  "diversified-telecommunication-services": "Telecom",
  automobiles: "Automotive",
  "broadline-retail": "Retail",
}

export function getIndustrySearchName(slug: string, name: string): string {
  return INDUSTRY_SEARCH_NAMES[slug] ?? name
}

const SECTOR_SEARCH_NAMES: Record<string, string> = {
  "Information Technology": "Technology",
  "Health Care": "Healthcare",
  Financials: "Finance",
  Industrials: "Manufacturing & Industrials",
  "Consumer Discretionary": "Consumer & Retail",
  "Communication Services": "Telecom & Media",
  "Consumer Staples": "Food & Consumer Goods",
}

export function getSectorSearchName(gicsSector: string): string {
  return SECTOR_SEARCH_NAMES[gicsSector] ?? gicsSector
}

const SECTOR_ACCENTS: Record<string, string> = {
  "Information Technology": "#38bdf8",
  "Health Care": "#43cc93",
  Financials: "#facc15",
  Industrials: "#fb923c",
  "Consumer Discretionary": "#f472b6",
  "Communication Services": "#a78bfa",
  Utilities: "#2dd4bf",
  "Consumer Staples": "#a3e635",
  Materials: "#e879f9",
  Energy: "#f87171",
  "Real Estate": "#818cf8",
}

export const DEFAULT_SECTOR_ACCENT = "#94a3b8"

export function getSectorAccent(gicsSector: string): string {
  return SECTOR_ACCENTS[gicsSector] ?? DEFAULT_SECTOR_ACCENT
}
