import type { Metadata } from "next"
import { absoluteUrl } from "@/lib/site-url"

/**
 * Per-page canonical + social tags. Without these, pages inherit the root
 * layout's homepage canonical and OG card, so every URL reports itself as a
 * duplicate of the homepage and shares as a generic "AI Atlas" preview.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
}: {
  title: string
  description: string
  path: string
  image?: string | null
  type?: "website" | "article"
}): Metadata {
  const canonical = absoluteUrl(path)
  const trimmedImage = image?.trim()
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type,
      url: canonical,
      title,
      description,
      images: trimmedImage ? [trimmedImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}
