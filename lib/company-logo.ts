export function getGoogleFaviconUrl(websiteUrl?: string | null): string {
  const raw = (websiteUrl ?? "").trim()
  if (!raw) return ""
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(raw)}&sz=128`
}
