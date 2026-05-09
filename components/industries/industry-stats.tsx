type StatItem = {
  label: string
  value: number | string
}

function formatValue(value: number | string): string {
  return typeof value === "number" ? value.toLocaleString() : value
}

export function IndustryStats({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-800 bg-[#1a1a1a] px-4 py-3"
        >
          <div className="text-2xl font-bold leading-tight text-[#43cc93]">
            {formatValue(item.value)}
          </div>
          <div className="mt-1 text-sm text-slate-400">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
