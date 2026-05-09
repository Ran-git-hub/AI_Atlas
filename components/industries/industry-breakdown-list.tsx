type BreakdownItem = {
  name: string
  count: number
}

export function IndustryBreakdownList({
  title,
  items,
}: {
  title: string
  items: BreakdownItem[]
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#1a1a1a] p-4">
      <h2 className="mb-3 text-lg font-semibold text-[#f5f5f5]">{title}</h2>
      {items.length > 0 ? (
        <div className="space-y-1.5">
          {items.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#121212] px-2.5 py-1.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#43cc93]/10 text-xs font-semibold text-[#43cc93]">
                  {index + 1}
                </span>
                <span className="truncate text-base font-medium text-slate-200">{item.name}</span>
              </div>
              <span className="shrink-0 text-sm text-slate-400">{item.count.toLocaleString()} cases</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No data available yet.</p>
      )}
    </section>
  )
}
