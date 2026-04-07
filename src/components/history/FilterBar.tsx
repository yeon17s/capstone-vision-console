import type { Filters } from "../../pages/History";

interface FilterBarProps {
  filters: Filters;
  trendHeights: number[];
  onChange: (f: Filters) => void;
  onApply: () => void;
}

export default function FilterBar({ filters, trendHeights, onChange, onApply }: FilterBarProps) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  const inputCls =
    "w-full rounded border border-mission-border bg-mission-bg px-3 py-1.5 text-xs text-mission-text placeholder-mission-text/30 focus:border-mission-info focus:outline-none";
  const smallInputCls =
    "flex-1 rounded border border-mission-border bg-mission-bg px-2 py-1 text-[11px] text-mission-text placeholder-mission-text/30 focus:border-mission-info focus:outline-none";

  return (
    <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto">
      {/* Search & Filter */}
      <div className="rounded-xl border border-mission-border bg-mission-panel p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-mission-text/50">
          Search &amp; Filter
        </p>

        <input
          type="text"
          placeholder="Search class, timestamp..."
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          className={`${inputCls} mb-3`}
        />

        <div className="mb-3">
          <p className="mb-1 text-[11px] text-mission-text/40">Date Range</p>
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="YYYY-MM-DD"
              value={filters.dateFrom}
              onChange={(e) => set("dateFrom", e.target.value)}
              className={smallInputCls}
            />
            <span className="text-[11px] text-mission-text/30">to</span>
            <input
              type="text"
              placeholder="YYYY-MM-DD"
              value={filters.dateTo}
              onChange={(e) => set("dateTo", e.target.value)}
              className={smallInputCls}
            />
          </div>
        </div>

        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[11px] text-mission-text/40">Confidence Min</p>
            <span className="font-mono text-[11px] text-mission-info">{filters.confMin}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-mission-text/30">0%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={filters.confMin}
              onChange={(e) => set("confMin", Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer accent-mission-info"
            />
            <span className="text-[10px] text-mission-text/30">100%</span>
          </div>
        </div>

        <div className="mb-3">
          <p className="mb-1 text-[11px] text-mission-text/40">Class</p>
          <select
            value={filters.cls}
            onChange={(e) => set("cls", e.target.value)}
            className="w-full rounded border border-mission-border bg-mission-bg px-2 py-1.5 text-xs text-mission-text focus:border-mission-info focus:outline-none"
          >
            <option value="">All Classes</option>
            <option value="person">Person</option>
            <option value="none">None</option>
          </select>
        </div>

        <div className="mb-4">
          <p className="mb-1 text-[11px] text-mission-text/40">Operator</p>
          <input
            type="text"
            placeholder="Text search"
            value={filters.operator}
            onChange={(e) => set("operator", e.target.value)}
            className={inputCls}
          />
        </div>

        <button
          type="button"
          onClick={onApply}
          className="w-full rounded border border-mission-info bg-mission-info/10 py-1.5 text-xs font-semibold text-mission-info transition-colors hover:bg-mission-info/20"
        >
          Apply Filter
        </button>
      </div>

      {/* Historical Detection Trend */}
      <div className="flex-1 rounded-xl border border-mission-border bg-mission-panel p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-mission-text/50">
          Historical Detection Trend
        </p>
        <div className="flex h-32 items-end gap-px rounded border border-mission-border bg-mission-bg px-2 pb-1">
          {trendHeights.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-mission-info/40"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-mission-text/30">
          <span>older</span>
          <span>recent</span>
        </div>
      </div>
    </aside>
  );
}
