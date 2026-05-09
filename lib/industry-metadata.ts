export type IndustryMetadata = {
  shortDescription: string
}

const FALLBACK_METADATA: IndustryMetadata = {
  shortDescription: "Real-world AI deployments tracked across companies/organizations, countries/regions, and use cases.",
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
    shortDescription: "Biotech companies/organizations using AI across research, discovery, validation, and production.",
  },
  "health-care-providers-and-services": {
    shortDescription: "Care delivery, providers, and health services applying AI to real operational workflows.",
  },
  "health-care-equipment-and-supplies": {
    shortDescription: "Medical equipment and supply companies/organizations embedding AI into products and workflows.",
  },
  "technology-hardware-and-equipment": {
    shortDescription: "Hardware, devices, and infrastructure companies/organizations deploying AI across the stack.",
  },
  "life-sciences-tools-and-services": {
    shortDescription: "Life sciences tools, diagnostics, and services using AI for research and operations.",
  },
  "capital-markets": {
    shortDescription: "Capital markets firms applying AI to analysis, trading, compliance, and operations.",
  },
  "food-beverage-and-tobacco": {
    shortDescription: "Food, beverage, and tobacco companies/organizations applying AI to products, operations, and supply chains.",
  },
  "telecommunication-services": {
    shortDescription: "Telecom operators and services using AI for networks, operations, and customer workflows.",
  },
}

export function getIndustryMetadata(slug: string): IndustryMetadata {
  return INDUSTRY_METADATA[slug] ?? FALLBACK_METADATA
}
