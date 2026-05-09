import { ATLAS_SITE_TAGLINE } from "@/components/atlas-site-tagline"

/** Split before `needle` (inclusive of leading space in second segment via `slice(i + 1)`). */
function mobileHeaderTwoLines(s: string, needle: string): readonly [string, string] {
  const i = s.indexOf(needle)
  if (i === -1) return [s, ""] as const
  return [s.slice(0, i), s.slice(i + 1)] as const
}

/** Two lines for compact header below `lg` (break before “ AI ”). */
export const ATLAS_TAGLINE_MOBILE_LINES = mobileHeaderTwoLines(ATLAS_SITE_TAGLINE, " AI ")
