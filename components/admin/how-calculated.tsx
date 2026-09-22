const BORDER = "#2f2f2f"
const MUTED = "#8a8a8a"

/**
 * The provenance note that sits under each panel.
 *
 * Every number on this page is either the weekly writer's own text or the
 * output of a specific engine, and which one it is changes how much weight it
 * carries. Keeping that on the page rather than in a document is deliberate:
 * the question it answers — "is that zero real?" — gets asked while looking at
 * the zero.
 */
export function HowCalculated({ children }: { children: React.ReactNode }) {
  return (
    <details className="mt-3 rounded-lg border" style={{ borderColor: BORDER }}>
      <summary className="cursor-pointer px-3 py-2 text-[11px] font-medium text-[#8a8a8a] transition-colors marker:text-[#5a5a5a] hover:text-[#d4d4d4]">
        How this is calculated
      </summary>
      <div className="space-y-3 border-t px-3 py-3" style={{ borderColor: BORDER }}>
        {children}
      </div>
    </details>
  )
}

export function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>
        {title}
      </p>
      <dl className="space-y-2">{children}</dl>
    </div>
  )
}

export function Term({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-x-3 gap-y-0.5 sm:grid-cols-[9rem_1fr]">
      <dt className="text-[11px] font-medium text-[#d4d4d4]">{term}</dt>
      <dd className="text-[11px] leading-relaxed" style={{ color: MUTED }}>
        {children}
      </dd>
    </div>
  )
}

export function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="space-y-2">{children}</ol>
}

export function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-0.5 shrink-0 text-[10px] tabular-nums" style={{ color: MUTED }}>
        {n}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium text-[#d4d4d4]">{title}</span>
        <span className="block text-[11px] leading-relaxed" style={{ color: MUTED }}>
          {children}
        </span>
      </span>
    </li>
  )
}

/** Marks a number the weekly writer produced in prose rather than one an engine computed. */
export function WriterNote() {
  return (
    <Term term="Who produced it">
      The weekly writer, as free text. Nothing on this page recomputes or checks it — the page can
      only show what was recorded.
    </Term>
  )
}
