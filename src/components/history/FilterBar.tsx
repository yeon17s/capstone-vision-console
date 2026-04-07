import type { Filters } from "../../pages/History";
import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";

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
    "w-full rounded border border-mission-border bg-mission-bg px-3 py-1.5 font-mono text-mission-control text-mission-text placeholder-mission-text/30 focus:border-mission-info focus:outline-none";
  const smallInputCls =
    "flex-1 rounded border border-mission-border bg-mission-bg px-2 py-1 font-mono text-mission-label text-mission-text placeholder-mission-text/30 focus:border-mission-info focus:outline-none";

  return (
    <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto">
      {/* Search & Filter */}
      <MissionPanel title="Search & Filter" bodyClassName="p-4">
        <input
          type="text"
          placeholder="Search class, timestamp..."
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          className={`${inputCls} mb-3`}
        />

        <div className="mb-3">
          <Typography variant="overline" tone="subtle" className="mb-1">Date Range</Typography>
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="YYYY-MM-DD"
              value={filters.dateFrom}
              onChange={(e) => set("dateFrom", e.target.value)}
              className={smallInputCls}
            />
            <Typography as="span" variant="overline" tone="subtle" className="tracking-[0.08em] text-mission-text/30">to</Typography>
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
            <Typography variant="overline" tone="subtle">Confidence Min</Typography>
            <Typography as="span" variant="monoStrong" tone="info">{filters.confMin}%</Typography>
          </div>
          <div className="flex items-center gap-2">
            <Typography as="span" variant="overline" className="text-mission-text/30">0%</Typography>
            <input
              type="range"
              min={0}
              max={100}
              value={filters.confMin}
              onChange={(e) => set("confMin", Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer accent-mission-info"
            />
            <Typography as="span" variant="overline" className="text-mission-text/30">100%</Typography>
          </div>
        </div>

        <div className="mb-3">
          <Typography variant="overline" tone="subtle" className="mb-1">Class</Typography>
          <select
            value={filters.cls}
            onChange={(e) => set("cls", e.target.value)}
            className="w-full rounded border border-mission-border bg-mission-bg px-2 py-1.5 text-mission-control text-mission-text focus:border-mission-info focus:outline-none"
          >
            <option value="">All Classes</option>
            <option value="person">Person</option>
            <option value="none">None</option>
          </select>
        </div>

        <div className="mb-4">
          <Typography variant="overline" tone="subtle" className="mb-1">Operator</Typography>
          <input
            type="text"
            placeholder="Text search"
            value={filters.operator}
            onChange={(e) => set("operator", e.target.value)}
            className={inputCls}
          />
        </div>

        <Button onClick={onApply} variant="infoOutline" size="md" className="w-full py-1.5">
          <Typography as="span" variant="controlStrong" tone="info">Apply Filter</Typography>
        </Button>
      </MissionPanel>

      {/* Historical Detection Trend */}
      <MissionPanel title="Historical Detection Trend" className="flex-1" bodyClassName="flex h-full flex-col p-4">
        <div className="flex h-32 items-end gap-px rounded border border-mission-border bg-mission-bg px-2 pb-1">
          {trendHeights.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-mission-info/40"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between">
          <Typography as="span" variant="overline" className="text-mission-text/30">older</Typography>
          <Typography as="span" variant="overline" className="text-mission-text/30">recent</Typography>
        </div>
      </MissionPanel>
    </aside>
  );
}
