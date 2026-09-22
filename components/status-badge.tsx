import { cn } from "@/lib/utils"

const KIND = {
  // An uppercase, letter-spaced label reads larger than its size, so 11px.
  new: {
    label: "New",
    className: "border-yellow-300/55 bg-yellow-200/15 text-[11px] uppercase tracking-wide text-yellow-200",
  },
  // Mixed-case words are read as text, so they get the 12px text floor.
  pending: {
    label: "To be validated",
    className: "border-sky-300/45 bg-sky-300/12 text-xs text-sky-100",
  },
} as const

/**
 * The "New" and "To be validated" pills. They were written out separately in
 * eight components, in three styles and at 9 and 10px; this is the one copy.
 *
 * `className` is merged last, so callers keep their own spacing (`mt-2`,
 * `ml-2`, `px-1.5`) without restating the badge itself.
 */
export function StatusBadge({
  kind,
  compact = false,
  className,
}: {
  kind: keyof typeof KIND
  /** Drops the vertical padding, for the table's compact density. */
  compact?: boolean
  className?: string
}) {
  const k = KIND[kind]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 font-semibold leading-4",
        compact ? "py-0" : "py-0.5",
        k.className,
        className,
      )}
    >
      {k.label}
    </span>
  )
}
