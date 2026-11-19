import { StatCardSkeleton } from "./DashBits";

/** Loading state of a dashboard page (shown while the server reads the data). */
export function DashLoading() {
  return (
    <div aria-busy="true" aria-live="polite" data-testid="loading-state">
      <span className="sr-only">Loading…</span>
      <div className="mb-6 flex items-end justify-between gap-4">
        <span className="ws-skeleton block h-10 w-72" />
        <span className="ws-skeleton block h-12 w-44" />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="ws-card space-y-4 p-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <span className="ws-skeleton h-[72px] w-[104px]" />
            <span className="flex-1 space-y-2"><span className="ws-skeleton block h-5 w-1/2" /><span className="ws-skeleton block h-4 w-1/3" /></span>
          </div>
        ))}
      </div>
    </div>
  );
}
