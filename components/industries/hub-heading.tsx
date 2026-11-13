import type { ReactNode } from "react"

export function HubHeading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-[var(--accent)]" />
      <h2 className="font-mono text-[13px] font-medium uppercase tracking-[0.16em] text-slate-100">{children}</h2>
      <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-white/10" />
      {aside ? <span className="shrink-0 font-mono text-xs tabular-nums text-slate-500">{aside}</span> : null}
    </div>
  )
}
