import type { WeeklyReportHighlight } from "@/lib/types-weekly-report"
import { OpenUseCaseDetailButton } from "@/components/blog/open-use-case-detail-button"

const INDEX_GREEN = "#43cc93"
const INDEX_BORDER = "#2f2f2f"
const INDEX_CARD_BG = "#121212"
const INDEX_MUTED = "#8a8a8a"
const INDEX_CHIP = "#f5f5f5"

/** Visual parity with `/use-cases` table use-case column. Inline colors avoid Tailwind purge/cache issues. */
export function WeeklyReportHighlightCard({ highlight }: { highlight: WeeklyReportHighlight }) {
  return (
    <div
      className="rounded-lg border px-3 py-2.5"
      style={{ borderColor: INDEX_BORDER, backgroundColor: INDEX_CARD_BG }}
    >
      <div className="mb-1.5 min-w-0">
        {highlight.use_case_id ? (
          <OpenUseCaseDetailButton
            variant="title"
            useCaseId={highlight.use_case_id}
            linkText={highlight.title ?? ""}
            style={{
              color: INDEX_GREEN,
              textDecoration: "underline",
              textDecorationColor: "rgba(67, 204, 147, 0.35)",
              textUnderlineOffset: "3px",
            }}
            className="block w-full min-w-0 cursor-pointer overflow-hidden text-left text-sm font-medium [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] hover:opacity-90 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43cc93]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#121212]"
          />
        ) : (
          <h4
            className="line-clamp-2 text-sm font-medium underline"
            style={{
              color: INDEX_GREEN,
              textDecorationColor: "rgba(67, 204, 147, 0.35)",
              textUnderlineOffset: "3px",
            }}
          >
            {highlight.title}
          </h4>
        )}
      </div>

      <p className="mb-2 line-clamp-2 text-xs leading-relaxed" style={{ color: INDEX_MUTED }}>
        {highlight.description}
      </p>

      <div className="flex flex-wrap gap-1">
        <span
          className="rounded border px-1.5 py-0.5 text-[10px]"
          style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: INDEX_CHIP }}
        >
          {highlight.company}
        </span>
        <span
          className="rounded border px-1.5 py-0.5 text-[10px]"
          style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: INDEX_CHIP }}
        >
          {highlight.country}
        </span>
        <span
          className="rounded border px-1.5 py-0.5 text-[10px]"
          style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: INDEX_CHIP }}
        >
          {highlight.industry}
        </span>
      </div>
    </div>
  )
}
