export interface NewsItem {
  id: string
  companyId: string | null
  title: string
  summary: string
  url: string | null
  sourceName: string
  publishedAt: string | null
  createdAt: string | null
  tags: string[]
  aiAtlasTake: string
  status?: string | null
}

/** One case name inside a take: `take.slice(index, index + length)` is the label. */
export interface NewsTakeLink {
  id: string
  index: number
  length: number
}

/** Ingredients of the generated take shown when the pipeline left one empty. */
export interface NewsTakeFallback {
  topic: string
  useCases: { id: string; label: string; industry: string }[]
  newsTitles: string[]
}

export interface NewsTakeRender {
  links: NewsTakeLink[]
  fallback: NewsTakeFallback | null
}
