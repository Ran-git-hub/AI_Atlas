/**
 * Site-wide date display: always Date-Month-Year, e.g. 6 Sep 2026.
 *
 * Pinned to Central Europe (the timezone the footer's "Latest Data Update"
 * already uses) so a record shows the same day everywhere — previously each
 * surface formatted in the viewer's own timezone, so the server and the
 * browser could disagree about which day a record belongs to.
 *
 * Month names come from en-US, which abbreviates to three letters ("Sep");
 * en-GB would render September as "Sept" and break the alignment.
 */
const CENTRAL_EUROPE_TZ = "Europe/Berlin"

const DATE_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: CENTRAL_EUROPE_TZ,
  year: "numeric",
  month: "short",
  day: "numeric",
})

/** `6 Sep 2026`, or "" when the value is missing or unparseable. */
export function formatAtlasDate(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const parts = DATE_PARTS.formatToParts(date)
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  return `${part("day")} ${part("month")} ${part("year")}`
}

/** `1 Sep 2026 – 7 Sep 2026`, collapsing to one side when the other is missing. */
export function formatAtlasDateRange(
  start: string | number | Date | null | undefined,
  end: string | number | Date | null | undefined,
): string {
  const from = formatAtlasDate(start)
  const to = formatAtlasDate(end)
  if (!from) return to
  if (!to) return from
  return `${from} – ${to}`
}

/** `6 Sep 2026, 23:59 CET` — the date format above plus time, for timestamps. */
export function formatAtlasDateTime(value: string | number | Date | null | undefined): string {
  const date = value instanceof Date ? value : new Date(value ?? NaN)
  if (Number.isNaN(date.getTime())) return ""
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: CENTRAL_EUROPE_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "shortGeneric",
  }).format(date)
  return `${formatAtlasDate(date)}, ${time}`
}
