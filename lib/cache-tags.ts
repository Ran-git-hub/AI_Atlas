/**
 * Cache tags, so a change can drop the caches it affects instead of everyone
 * waiting out a timer.
 *
 * Without these, freshness and cost pull against each other: the only way to
 * see an edit sooner is a shorter revalidate, and a shorter revalidate means
 * more regenerations. Tagged, the two come apart - the timer becomes a
 * once-a-day backstop and edits publish immediately.
 *
 * Tags are per data domain, not per cache entry, because one edited use case
 * dirties five of them: the catalog, the globe's coordinates, the industry and
 * country rollups, and the related-cases list.
 */
export const CACHE_TAGS = {
  useCases: "use-cases",
  news: "news",
  companies: "companies",
} as const

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]

/**
 * Next 16's revalidateTag needs a cache-life profile as its second argument,
 * and it means "how much longer may this tag's entries live", not "what should
 * the refreshed entry's lifetime be". Anything above zero leaves them in place:
 * passing { expire: 86400 } to match the caches' own fallback made the call a
 * silent no-op, verified against a probe on the Supabase query. Zero is what
 * actually purges.
 */
export const CACHE_TAG_LIFE = { expire: 0 } as const
