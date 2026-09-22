"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { IssueStatus } from "@/lib/data-weekly-ops-state"
import type { OpsIssue } from "@/lib/weekly-ops-issues"

const BORDER = "#2f2f2f"
const MUTED = "#8a8a8a"
const GREEN = "#43cc93"
const BLUE = "#60a5fa"
const RED = "#ef4444"

export const STATUS_COLOR: Record<IssueStatus, string> = {
  acked: BLUE,
  done: GREEN,
  ignored: MUTED,
}
export const STATUS_LABEL: Record<IssueStatus, string> = {
  acked: "acknowledged",
  done: "done",
  ignored: "won't fix",
}

/**
 * The operator's verdict on an issue. Shared so the week view and the issue
 * view offer the same control rather than the week view being read-only and
 * silently pointing nowhere.
 */
export function IssueMarkControls({
  issue,
  newestWeek,
  withNote = true,
}: {
  issue: OpsIssue
  newestWeek: { year: number; isoWeek: number }
  withNote?: boolean
}) {
  const [note, setNote] = useState(issue.adminNote ?? "")
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function save(status: IssueStatus | null, nextNote: string) {
    setError(null)
    startTransition(async () => {
      const res = await fetch("/api/admin/weekly-issues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueKey: issue.key,
          status,
          note: nextNote,
          statusYear: newestWeek.year,
          statusIsoWeek: newestWeek.isoWeek,
          source: issue.source,
          location: issue.location,
          sampleText: issue.latest.text,
        }),
      })
      const body = (await res.json()) as { ok: boolean; error?: string }
      if (!body.ok) {
        setError(body.error ?? "Save failed")
        return
      }
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider" style={{ color: MUTED }}>
          Mark as
        </span>
        {(["acked", "done", "ignored"] as const).map((s) => {
          const active = issue.adminStatus === s
          return (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => save(active ? null : s, note)}
              className="rounded border px-2 py-1 text-[13px] font-medium transition-colors disabled:opacity-50"
              style={{
                borderColor: active ? `${STATUS_COLOR[s]}66` : BORDER,
                background: active ? `${STATUS_COLOR[s]}1a` : "transparent",
                color: active ? STATUS_COLOR[s] : MUTED,
              }}
            >
              {STATUS_LABEL[s]}
            </button>
          )
        })}
        {issue.adminStatus && (
          <button
            type="button"
            disabled={pending}
            onClick={() => save(null, "")}
            className="text-[13px] transition-colors hover:text-[#f5f5f5] disabled:opacity-50"
            style={{ color: MUTED }}
          >
            clear
          </button>
        )}
        {pending && (
          <span className="text-[13px]" style={{ color: MUTED }}>
            saving…
          </span>
        )}
        {error && (
          <span className="text-[13px]" style={{ color: RED }}>
            {error}
          </span>
        )}
      </div>

      {withNote && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            if (note !== (issue.adminNote ?? "") && issue.adminStatus) save(issue.adminStatus, note)
          }}
          placeholder={issue.adminStatus ? "Note — why, or what you did" : "Pick a status first, then add a note"}
          rows={2}
          className="mt-2 w-full rounded border bg-transparent px-2 py-1.5 text-[13px] leading-relaxed text-[#d4d4d4] outline-none placeholder:text-[#5a5a5a] focus:border-[#43cc9366]"
          style={{ borderColor: BORDER }}
        />
      )}
    </div>
  )
}
