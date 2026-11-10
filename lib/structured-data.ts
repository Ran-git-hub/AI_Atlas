import { absoluteUrl } from "@/lib/site-url"

const ORG_NAME = "AI Atlas"

export function organizationNode() {
  return {
    "@type": "Organization",
    name: ORG_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/ai-atlas-logo.png"),
  }
}

/** Organization + WebSite for the site as a whole. */
export function siteSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(),
      {
        "@type": "WebSite",
        name: ORG_NAME,
        url: absoluteUrl("/"),
        description:
          "Explore real-world AI deployments across companies, industries and countries.",
        publisher: { "@type": "Organization", name: ORG_NAME },
      },
    ],
  }
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  }
}

export function useCasesDatasetSchema({
  name,
  description,
  rows,
}: {
  name: string
  description: string
  rows: { industry?: string | null; country?: string | null; created_at?: string | null }[]
}) {
  const distinct = (values: (string | null | undefined)[]) =>
    [...new Set(values.map((v) => v?.trim()).filter((v): v is string => Boolean(v)))].sort()
  const latestMs = Math.max(0, ...rows.map((row) => Date.parse(row.created_at ?? "") || 0))
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name,
    description,
    url: absoluteUrl("/use-cases"),
    ...(latestMs ? { dateModified: new Date(latestMs).toISOString() } : {}),
    creator: organizationNode(),
    spatialCoverage: distinct(rows.map((row) => row.country)).map((country) => ({
      "@type": "Place",
      name: country,
    })),
    keywords: distinct(rows.map((row) => row.industry)),
  }
}

/**
 * A use case is an editorial summary AI Atlas wrote about someone else's
 * deployment, so Article with `isBasedOn` pointing at the primary source is the
 * honest shape — `about` names the deploying organization.
 */
export function useCaseArticleSchema({
  id,
  title,
  description,
  companyName,
  industry,
  country,
  createdAt,
  sourceUrl,
}: {
  id: string
  title: string
  description?: string | null
  companyName?: string | null
  industry?: string | null
  country?: string | null
  createdAt?: string | null
  sourceUrl?: string | null
}) {
  const canonical = absoluteUrl(`/use-cases/${encodeURIComponent(id)}`)
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    ...(description ? { description } : {}),
    url: canonical,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    image: `${canonical}/opengraph-image`,
    ...(createdAt ? { datePublished: createdAt } : {}),
    author: organizationNode(),
    publisher: organizationNode(),
    ...(companyName ? { about: { "@type": "Organization", name: companyName } } : {}),
    ...(sourceUrl ? { isBasedOn: sourceUrl } : {}),
    keywords: [industry, country].filter(Boolean).join(", ") || undefined,
  }
}

/**
 * `<` is escaped because JSON-LD sits inside a <script> block, where a `</`
 * inside any string value would otherwise close the tag early.
 */
export function jsonLdProps(schema: unknown) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
    },
  }
}
