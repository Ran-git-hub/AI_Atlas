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
