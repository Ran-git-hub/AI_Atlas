import { VISITORS_BEFORE, VISITORS_BEFORE_UNTIL, type VisitorStats } from "@/lib/data-visitors"
import { cn } from "@/lib/utils"

const regionNames = new Intl.DisplayNames(["en"], { type: "region" })

function countryName(code: string | null): string {
  if (!code) return "Unknown"
  try {
    return regionNames.of(code) ?? code
  } catch {
    return code
  }
}

function formatDay(day: string, withYear = false): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  })
}

const n = (value: number) => value.toLocaleString("en-US")

function StatTile({
  label,
  value,
  note,
  accent,
}: {
  label: string
  value: string
  note: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-[#1c1c1c] p-4",
        accent ? "border-[#43cc93]/40" : "border-[#2f2f2f]",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8a8a8a]">
        {label}
      </p>
      <p className={cn("mt-2 text-3xl font-semibold tabular-nums", accent ? "text-[#43cc93]" : "text-[#f5f5f5]")}>
        {value}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[#8a8a8a]">{note}</p>
    </div>
  )
}

export function VisitorStatsView({ stats }: { stats: VisitorStats }) {
  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.visitors))
  const countryTotal = stats.countries.reduce((sum, c) => sum + c.visitors, 0)
  const since = stats.firstDay ? formatDay(stats.firstDay, true) : "the first visit"

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Total (estimated)"
          value={n(VISITORS_BEFORE + stats.total)}
          note={`${n(VISITORS_BEFORE)} estimated before ${formatDay(VISITORS_BEFORE_UNTIL, true)} + ${n(stats.total)} recorded since ${since}`}
          accent
        />
        <StatTile label="Today" value={n(stats.today)} note="Visitors so far today (UTC)" />
        <StatTile label="Last 7 days" value={n(stats.last7)} note="Distinct visitors" />
        <StatTile label="Last 30 days" value={n(stats.last30)} note="Distinct visitors" />
      </div>

      <section className="rounded-xl border border-[#2f2f2f] bg-[#1c1c1c] p-4">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold">Daily visitors</h2>
          <p className="text-xs text-[#8a8a8a]">Last 30 days · peak {n(maxDaily)}</p>
        </div>
        <div className="flex h-40 items-end gap-[2px] sm:gap-1">
          {stats.daily.map((d) => (
            <div
              key={d.day}
              title={`${formatDay(d.day)}: ${n(d.visitors)}`}
              className="flex h-full flex-1 flex-col justify-end"
            >
              <div
                className="rounded-t-sm bg-[#43cc93]/70 transition-colors hover:bg-[#43cc93]"
                style={{ height: `${Math.max(d.visitors ? 2 : 0, (d.visitors / maxDaily) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-[#8a8a8a]">
          <span>{stats.daily[0] ? formatDay(stats.daily[0].day) : ""}</span>
          <span>Today</span>
        </div>
      </section>

      <section className="rounded-xl border border-[#2f2f2f] bg-[#1c1c1c] p-4">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold">By country</h2>
          <p className="text-xs text-[#8a8a8a]">Last 30 days · {stats.countries.length} countries</p>
        </div>
        {stats.countries.length === 0 ? (
          <p className="text-sm text-[#8a8a8a]">No visits recorded in the last 30 days.</p>
        ) : (
          <ul className="space-y-2.5">
            {stats.countries.map((c) => {
              const share = countryTotal ? (c.visitors / countryTotal) * 100 : 0
              return (
                <li key={c.country ?? "unknown"} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[minmax(0,12rem)_1fr_auto]">
                  <span className="truncate text-[#d4d4d4]">{countryName(c.country)}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-[#2a2a2a]">
                    <span className="block h-full rounded-full bg-[#43cc93]/70" style={{ width: `${share}%` }} />
                  </span>
                  <span className="text-right tabular-nums text-[#b3b3b3]">
                    {n(c.visitors)}
                    <span className="ml-2 inline-block w-11 text-xs text-[#8a8a8a]">{share.toFixed(1)}%</span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <p className="text-xs leading-relaxed text-[#8a8a8a]">
        A visitor is one browser, identified by a random ID kept in its local
        storage. Admin pages, the operator&apos;s own browser and automated
        browsers are not recorded. Days are UTC; the daily chart counts each
        browser once per day.
      </p>
    </div>
  )
}
