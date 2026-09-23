/**
 * The value, trimmed, if it parses as an absolute http(s) URL; otherwise null.
 *
 * For links whose target comes from pipeline-written fields. Those are written
 * by agents reading third-party pages, so a `javascript:` value would render a
 * link that runs code when clicked, and a bare `example.com` renders as a path
 * relative to this site and lands on a 404. Neither should become an href.
 * A scheme-less value is not repaired by prefixing https:// here: where the
 * data layer does that (normalizeWebsiteUrl for company sites) it has already
 * happened, and elsewhere a bare domain is more often a stray source than a
 * link anyone meant.
 */
export function httpUrlOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  try {
    const { protocol } = new URL(trimmed)
    return protocol === "http:" || protocol === "https:" ? trimmed : null
  } catch {
    return null
  }
}
