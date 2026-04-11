import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import type { BlogArticleContent } from "@/lib/types-blog"
import { cn } from "@/lib/utils"

function articleMarkdownSource(content: BlogArticleContent): string {
  return (content.markdown ?? content.body ?? "").trim()
}

const mdComponents: Components = {
  h1: ({ className, ...props }) => (
    <h1
      className={cn("mb-3 mt-8 text-xl font-bold tracking-tight text-[#f5f5f5] first:mt-0", className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn("mb-2 mt-6 border-b border-slate-800 pb-1.5 text-lg font-semibold text-[#f5f5f5]", className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3 className={cn("mb-2 mt-5 text-base font-semibold text-slate-100", className)} {...props} />
  ),
  h4: ({ className, ...props }) => (
    <h4 className={cn("mb-2 mt-4 text-sm font-semibold text-slate-200", className)} {...props} />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("mb-3 text-sm leading-relaxed text-slate-300 last:mb-0", className)} {...props} />
  ),
  a: ({ className, href, ...props }) => {
    const external = Boolean(href && /^https?:\/\//i.test(href))
    return (
      <a
        href={href}
        className={cn("font-medium text-cyan-400 underline decoration-cyan-500/40 underline-offset-2 hover:text-cyan-300", className)}
        rel={external ? "noopener noreferrer" : undefined}
        target={external ? "_blank" : undefined}
        {...props}
      />
    )
  },
  ul: ({ className, ...props }) => (
    <ul className={cn("mb-3 list-disc space-y-1 pl-5 text-sm text-slate-300", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn("mb-3 list-decimal space-y-1 pl-5 text-sm text-slate-300", className)} {...props} />
  ),
  li: ({ className, ...props }) => <li className={cn("leading-relaxed", className)} {...props} />,
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn("mb-3 border-l-2 border-cyan-500/35 pl-3 text-sm italic text-slate-400", className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => <hr className={cn("my-6 border-slate-800", className)} {...props} />,
  table: ({ className, ...props }) => (
    <div className="mb-3 overflow-x-auto rounded-lg border border-slate-800">
      <table className={cn("w-full min-w-[16rem] border-collapse text-left text-sm text-slate-300", className)} {...props} />
    </div>
  ),
  thead: ({ className, ...props }) => <thead className={cn("bg-slate-900/80", className)} {...props} />,
  th: ({ className, ...props }) => (
    <th className={cn("border border-slate-800 px-2.5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200", className)} {...props} />
  ),
  td: ({ className, ...props }) => (
    <td className={cn("border border-slate-800 px-2.5 py-2 align-top", className)} {...props} />
  ),
  tr: ({ className, ...props }) => <tr className={cn("even:bg-slate-900/40", className)} {...props} />,
  pre: ({ className, ...props }) => (
    <pre
      className={cn("mb-3 overflow-x-auto rounded-lg border border-slate-800 bg-[#0d1117] p-3 text-xs leading-relaxed", className)}
      {...props}
    />
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = typeof className === "string" && className.includes("language-")
    if (isBlock) {
      return (
        <code className={cn("block font-mono text-slate-200", className)} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className={cn(
          "rounded bg-slate-800/90 px-1 py-0.5 font-mono text-[0.85em] text-cyan-200/90",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    )
  },
  img: ({ className, alt, ...props }) => (
    <span className="mb-3 block">
      <img className={cn("max-h-[min(70vh,32rem)] max-w-full rounded-md border border-slate-800", className)} alt={alt ?? ""} {...props} />
    </span>
  ),
  strong: ({ className, ...props }) => (
    <strong className={cn("font-semibold text-slate-100", className)} {...props} />
  ),
}

export function BlogArticleBody({ content }: { content: BlogArticleContent }) {
  const source = articleMarkdownSource(content)
  if (!source) {
    return (
      <p className="rounded-lg border border-slate-800 bg-[#1a1a1a] px-3 py-4 text-sm text-slate-500">
        No article body yet.
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-[#1a1a1a] px-4 py-5 md:px-5">
      <div className="blog-article-md max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
          components={mdComponents}
          urlTransform={(url) => {
            if (url.startsWith("javascript:") || url.startsWith("data:")) return ""
            return url
          }}
        >
          {source}
        </ReactMarkdown>
      </div>
    </div>
  )
}
