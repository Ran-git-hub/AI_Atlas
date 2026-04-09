import { AtlasSiteTagline } from "@/components/atlas-site-tagline"
import { Skeleton } from "@/components/ui/skeleton"

export default function UseCasesLoading() {
  return (
    <main className="dark min-h-dvh bg-[#121212] text-[#f5f5f5]" style={{ colorScheme: "dark" }}>
      <div className="mx-auto max-w-7xl p-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <p className="sr-only" role="status">
          Loading use case index…
        </p>

        <div className="relative w-full min-w-0 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-x-3 lg:gap-y-2">
          <div className="hidden min-w-0 lg:block" aria-hidden="true" />
          <div className="flex min-w-0 max-w-full flex-col gap-1 pr-[4.5rem] lg:flex-row lg:flex-wrap lg:items-center lg:justify-center lg:gap-x-3 lg:gap-y-2 lg:pr-0">
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Skeleton className="h-8 w-8 shrink-0 rounded-xl bg-slate-700/50 sm:h-10 sm:w-10 lg:h-9 lg:w-9" />
              <Skeleton className="h-5 w-[4.5rem] shrink-0 rounded bg-slate-700/45 sm:h-6 sm:w-24" />
            </div>
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 lg:contents">
              <AtlasSiteTagline className="min-w-0 max-w-full flex-1 text-left text-[11px] leading-tight tracking-tight lg:flex-[0_1_auto] lg:max-w-md lg:text-center lg:text-sm lg:leading-snug lg:tracking-wide" />
              <Skeleton className="h-8 w-[3.25rem] shrink-0 rounded-full bg-slate-700/50 lg:h-8 lg:w-[9.5rem]" />
            </div>
          </div>
          <div className="absolute right-0 top-0 z-10 lg:relative lg:top-auto lg:right-auto lg:flex lg:min-w-0 lg:justify-end lg:self-center">
            <Skeleton className="h-9 w-20 shrink-0 rounded-full bg-slate-700/50" />
          </div>
        </div>

        <div className="mt-2.5 flex flex-col gap-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Skeleton className="h-10 w-full rounded-full bg-slate-700/45 md:h-9 md:max-w-[460px]" />
          <div className="grid grid-cols-2 gap-2 md:ml-auto md:flex md:flex-row md:justify-end">
            {[0, 1, 2, 3].map((k) => (
              <Skeleton key={k} className="h-10 rounded-full bg-slate-700/45 md:h-9 md:w-[150px]" />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <Skeleton className="h-5 min-h-[1.25rem] w-full max-w-2xl rounded bg-slate-700/35" />
          <Skeleton className="h-8 w-[9.5rem] shrink-0 rounded-full bg-slate-700/45" />
        </div>

        <div className="overflow-hidden rounded-xl border border-[#2f2f2f] bg-[#181818]">
          <div
            className="flex gap-2 border-b border-[#2f2f2f] bg-[#0f0f0f]/80 px-3 py-2.5 md:gap-3 md:px-4 md:py-3"
            aria-hidden
          >
            <Skeleton className="h-4 min-w-[7rem] flex-[1.4] rounded bg-slate-600/30" />
            <Skeleton className="h-4 min-w-[4rem] flex-[0.5] rounded bg-slate-600/30" />
            <Skeleton className="h-4 min-w-[5rem] flex-[0.8] rounded bg-slate-600/30" />
            <Skeleton className="hidden h-4 min-w-[4rem] flex-[0.6] rounded bg-slate-600/30 md:block" />
            <Skeleton className="hidden h-4 min-w-[3.5rem] flex-[0.45] rounded bg-slate-600/30 md:block" />
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-2 border-b border-[#2f2f2f]/90 px-3 py-2.5 last:border-b-0 md:gap-3 md:px-4 md:py-3"
            >
              <div className="flex min-w-0 flex-[1.4] flex-col gap-2 py-0.5">
                <Skeleton className="h-4 w-full max-w-[95%] rounded bg-slate-700/35" />
                <Skeleton className="h-3 w-full max-w-[70%] rounded bg-slate-700/25" />
              </div>
              <Skeleton className="mt-1 h-3.5 min-w-[3.5rem] flex-[0.5] rounded bg-slate-700/30" />
              <Skeleton className="mt-1 h-10 min-w-[4.5rem] flex-[0.8] rounded bg-slate-700/28" />
              <Skeleton className="mt-1 hidden h-10 flex-[0.6] rounded bg-slate-700/28 md:block" />
              <Skeleton className="mt-1 hidden h-3.5 flex-[0.45] rounded bg-slate-700/28 md:block" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-4 w-52 rounded bg-slate-700/30" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[7.5rem] rounded-md border border-white/10 bg-slate-800/50 md:h-8" />
            <Skeleton className="h-10 w-20 rounded-md border border-white/10 bg-slate-800/50 md:h-8" />
            <Skeleton className="h-10 w-16 rounded-md border border-white/10 bg-slate-800/50 md:h-8" />
          </div>
        </div>

        <Skeleton className="mx-auto h-14 w-full max-w-3xl rounded-xl bg-slate-800/40" />

        <div className="flex flex-wrap items-center justify-center gap-4 border-t border-white/5 pt-4">
          <Skeleton className="h-3 w-48 rounded bg-slate-700/25" />
          <Skeleton className="h-3 w-40 rounded bg-slate-700/25" />
          <Skeleton className="h-8 w-28 rounded-full bg-slate-700/40" />
        </div>
        </div>
      </div>
    </main>
  )
}
