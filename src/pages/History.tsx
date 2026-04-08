import { useState, useMemo } from "react";
import useRobotStore, { type DetectionLogEntry } from "../store/robotStore";
import DetailModal from "../components/history/DetailModal";
import DetectionTable from "../components/history/DetectionTable";
import FilterBar from "../components/history/FilterBar";

export type RowStatus = "Confirmed" | "Pending" | "FalsePositive";

export interface Filters {
  search: string;
  dateFrom: string;
  dateTo: string;
  confMin: number; // 0–100 percentage
  cls: string;
  operator: string;
}

const DEMO_ENTRIES: DetectionLogEntry[] = [
  { timestamp: "2026-04-07 10:45:22", class: "person", confidence: 0.985, bbox: { x: 150, y: 120, w: 80, h: 140 }, fps: 24.0, frameDelayMs: 42, mode: "RGB" },
  { timestamp: "2026-04-07 10:44:18", class: "person", confidence: 0.850, bbox: { x: 90,  y: 60,  w: 60, h: 120 }, fps: 22.1, frameDelayMs: 55, mode: "RGB" },
  { timestamp: "2026-04-07 10:43:05", class: "person", confidence: 0.921, bbox: { x: 200, y: 90,  w: 70, h: 130 }, fps: 23.5, frameDelayMs: 48, mode: "INVERT" },
  { timestamp: "2026-04-07 10:41:30", class: "person", confidence: 0.789, bbox: { x: 50,  y: 40,  w: 55, h: 100 }, fps: 21.0, frameDelayMs: 62, mode: "RGB" },
  { timestamp: "2026-04-07 10:39:55", class: "person", confidence: 0.945, bbox: { x: 180, y: 110, w: 85, h: 145 }, fps: 24.8, frameDelayMs: 40, mode: "RGB" },
  { timestamp: "2026-04-07 10:38:12", class: "none",   confidence: 0.610, bbox: { x: 0,   y: 0,   w: 0,  h: 0   }, fps: 20.0, frameDelayMs: 50, mode: "EDGE" },
  { timestamp: "2026-04-07 10:36:44", class: "person", confidence: 0.882, bbox: { x: 120, y: 80,  w: 65, h: 125 }, fps: 23.0, frameDelayMs: 46, mode: "RGB" },
  { timestamp: "2026-04-07 10:35:00", class: "person", confidence: 0.911, bbox: { x: 160, y: 100, w: 75, h: 135 }, fps: 24.2, frameDelayMs: 43, mode: "INVERT" },
  { timestamp: "2026-04-07 10:33:30", class: "person", confidence: 0.859, bbox: { x: 100, y: 70,  w: 60, h: 115 }, fps: 22.5, frameDelayMs: 52, mode: "RGB" },
  { timestamp: "2026-04-07 10:31:15", class: "person", confidence: 0.730, bbox: { x: 70,  y: 50,  w: 50, h: 105 }, fps: 21.8, frameDelayMs: 58, mode: "RGB" },
  { timestamp: "2026-04-07 10:29:40", class: "person", confidence: 0.968, bbox: { x: 140, y: 95,  w: 78, h: 138 }, fps: 25.0, frameDelayMs: 39, mode: "RGB" },
  { timestamp: "2026-04-07 10:27:00", class: "none",   confidence: 0.540, bbox: { x: 0,   y: 0,   w: 0,  h: 0   }, fps: 19.5, frameDelayMs: 65, mode: "EDGE" },
];

const DEFAULT_FILTERS: Filters = {
  search: "",
  dateFrom: "",
  dateTo: "",
  confMin: 0,
  cls: "",
  operator: "",
};

export default function History() {
  const storeLog = useRobotStore((s) => s.detectionLog);
  const entries = storeLog.length > 0 ? storeLog : DEMO_ENTRIES;

  const [pendingFilters, setPendingFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);
  const [statusOverride, setStatusOverride] = useState<Record<string, RowStatus>>({});

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const confPct = e.confidence * 100;
      if (confPct < appliedFilters.confMin) return false;
      if (appliedFilters.cls && e.class !== appliedFilters.cls) return false;
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!e.class.toLowerCase().includes(q) && !e.timestamp.includes(q)) return false;
      }
      if (appliedFilters.dateFrom && e.timestamp < appliedFilters.dateFrom) return false;
      if (appliedFilters.dateTo && e.timestamp > appliedFilters.dateTo + " 23:59:59") return false;
      return true;
    });
  }, [entries, appliedFilters]);

  const trendHeights = useMemo(() => {
    if (entries.length === 0) return Array(12).fill(5) as number[];
    const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const bucketSize = Math.max(1, Math.ceil(sorted.length / 12));
    return Array.from({ length: 12 }, (_, i) => {
      const count = sorted.slice(i * bucketSize, (i + 1) * bucketSize).length;
      return Math.max(5, Math.min(100, (count / bucketSize) * 100));
    });
  }, [entries]);

  const selectedEntry = selectedIdx !== null ? (filteredEntries[selectedIdx] ?? null) : null;

  function getStatus(entry: DetectionLogEntry): RowStatus {
    return statusOverride[entry.timestamp] ?? "Confirmed";
  }

  function handleApplyFilter() {
    setAppliedFilters(pendingFilters);
    setSelectedIdx(null);
  }

  function handleMarkFalsePositive() {
    if (selectedEntry) {
      setStatusOverride((prev) => ({ ...prev, [selectedEntry.timestamp]: "FalsePositive" }));
    }
  }

  return (
    <main className="grid min-h-0 flex-1 grid-cols-[380px_minmax(0,1fr)_380px] gap-3 overflow-hidden p-3">
      <FilterBar
        filters={pendingFilters}
        trendHeights={trendHeights}
        onChange={setPendingFilters}
        onApply={handleApplyFilter}
      />
      <section className="min-h-0 overflow-hidden">
        <DetectionTable
          entries={filteredEntries}
          selectedIdx={selectedIdx}
          getStatus={getStatus}
          onSelect={setSelectedIdx}
        />
      </section>
      <aside className="min-h-0 overflow-hidden">
        <DetailModal
          entry={selectedEntry}
          status={selectedEntry ? getStatus(selectedEntry) : "Confirmed"}
          onMarkFalsePositive={handleMarkFalsePositive}
        />
      </aside>
    </main>
  );
}
