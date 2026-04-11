import {
  getCompaniesWithCoords,
  getLatestAtlasDataUpdateCetDisplay,
  getUseCasesWithCoords,
} from "@/lib/data"
import { HomeClient } from "@/components/home-client"

type SearchParams = Record<string, string | string[] | undefined>

function singleParam(sp: SearchParams, key: string): string | undefined {
  const v = sp[key]
  if (Array.isArray(v)) return v[0]?.trim() || undefined
  return v?.trim() || undefined
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [companies, useCases, latestDataUpdateCet, sp] = await Promise.all([
    getCompaniesWithCoords(),
    getUseCasesWithCoords(),
    getLatestAtlasDataUpdateCetDisplay(),
    searchParams,
  ])

  const deepLinkUseCaseId = singleParam(sp, "useCaseId")

  return (
    <HomeClient
      companies={companies}
      useCases={useCases}
      latestDataUpdateCet={latestDataUpdateCet}
      deepLinkUseCaseId={deepLinkUseCaseId}
    />
  )
}
