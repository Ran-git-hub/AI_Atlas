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

export interface NewsTakeUseCase {
  id: string
  title: string
  companyName: string
  industry: string
  description: string
}

export interface NewsTakeReference {
  id: string
  title: string
  summary: string
  sourceName: string
  tags: string[]
}

export interface NewsTakeContext {
  useCases: NewsTakeUseCase[]
  news: NewsTakeReference[]
}
