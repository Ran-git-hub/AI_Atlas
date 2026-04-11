import type { WeeklyReportContent } from "@/lib/types-weekly-report"

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#1a1a1a] px-3 py-2">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-cyan-500/10 text-cyan-400">
        {icon}
      </div>
      <div>
        <div className="text-lg font-bold text-[#f5f5f5]">{value}</div>
        <div className="text-[10px] text-slate-400">{label}</div>
      </div>
    </div>
  )
}

export function WeeklyReportStats({ overview }: { overview: WeeklyReportContent["overview"] }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <StatCard
        label="New Use Cases"
        value={overview.newUseCases}
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      />
      <StatCard
        label="New Companies"
        value={overview.newCompanies}
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
          </svg>
        }
      />
      <StatCard
        label="Countries"
        value={overview.countriesCount}
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <StatCard
        label="Industries"
        value={overview.industriesCount}
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        }
      />
    </div>
  )
}
