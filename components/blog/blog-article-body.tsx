import type { BlogArticleContent } from "@/lib/types-blog"

function articlePlainText(content: BlogArticleContent): string {
  const t = (content.markdown ?? content.body ?? "").trim()
  return t
}

export function BlogArticleBody({ content }: { content: BlogArticleContent }) {
  const text = articlePlainText(content)
  if (!text) {
    return (
      <p className="rounded-lg border border-slate-800 bg-[#1a1a1a] px-3 py-4 text-sm text-slate-500">
        No article body yet.
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-[#1a1a1a] px-4 py-4">
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">{text}</pre>
    </div>
  )
}
