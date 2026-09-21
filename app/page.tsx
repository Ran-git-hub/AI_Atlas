import {
  getCachedCompaniesWithCoords,
  getCachedUseCasesWithCoords,
  getCachedLatestAtlasDataUpdateCetDisplay,
} from "@/lib/data"
import { HomeClient } from "@/components/home-client"

/**
 * Prerendered, like /news and the hub pages.
 *
 * This page used to await searchParams, to read one `useCaseId` deep link. That
 * single await opted the whole route out of static rendering: every visit
 * re-rendered the globe and re-serialised its payload, which is the work Fluid
 * Active CPU is billed on. HomeClient consumed the value in an effect after
 * hydration anyway, so it now reads the query string itself - the same thing it
 * already does to clear the parameter when the panel closes.
 *
 * The timer is a backstop; the pipeline's revalidateTag on CACHE_TAGS.useCases
 * is what publishes an edit. See lib/cache-tags.ts.
 */
export const revalidate = 86400

export default async function Home() {
  const [companies, useCases, latestDataUpdateCet] = await Promise.all([
    getCachedCompaniesWithCoords(),
    getCachedUseCasesWithCoords(),
    getCachedLatestAtlasDataUpdateCetDisplay(),
  ])

  return (
    <HomeClient
      companies={companies}
      useCases={useCases}
      latestDataUpdateCet={latestDataUpdateCet}
    />
  )
}
