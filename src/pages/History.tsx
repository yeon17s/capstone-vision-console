import { useState, useMemo, useEffect, useCallback } from "react";
import useRobotStore, { type DetectionLogEntry } from "../store/robotStore";
import useSettingsStore from "../store/settingsStore";
import DetailModal from "../components/history/DetailModal";
import DetectionTable from "../components/history/DetectionTable";
import FilterBar from "../components/history/FilterBar";
import { fetchHistoryLog } from "../lib/historyApi";

export type RowStatus = "Confirmed" | "Pending" | "FalsePositive";

export interface Filters {
  search: string;
  dateFrom: string;
  dateTo: string;
  confMin: number; // 0–100 percentage
  operator: string;
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  dateFrom: "",
  dateTo: "",
  confMin: 0,
  operator: "",
};

const FP_STORAGE_KEY = "sentinel-fp-overrides";

function loadFpOverrides(): Record<string, RowStatus> {
  try {
    const raw = localStorage.getItem(FP_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, RowStatus>) : {};
  } catch {
    return {};
  }
}

function saveFpOverrides(overrides: Record<string, RowStatus>): void {
  try {
    localStorage.setItem(FP_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // localStorage 용량 초과 시 무시
  }
}

export default function History() {
  const historyLog = useRobotStore((s) => s.historyLog);
  const mergeHistoryLog = useRobotStore((s) => s.mergeHistoryLog);
  const fastapiUrl = useSettingsStore((s) => s.fastapiUrl);

  const [fetchStatus, setFetchStatus] = useState<"idle" | "loading" | "error">("idle");
  const [pendingFilters, setPendingFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);
  const [statusOverride, setStatusOverride] = useState<Record<string, RowStatus>>(loadFpOverrides);

  useEffect(() => {
    // cancelled 플래그: fastapiUrl 변경 시 이전 요청 결과가 늦게 도착해도 무시
    let cancelled = false;
    setFetchStatus("loading");
    fetchHistoryLog(fastapiUrl)
      .then((entries) => {
        if (cancelled) return;
        mergeHistoryLog(entries);
        setFetchStatus("idle");
      })
      .catch(() => {
        if (cancelled) return;
        setFetchStatus("error");
      });
    return () => { cancelled = true; };
  }, [fastapiUrl, mergeHistoryLog]);

  const entries: DetectionLogEntry[] = historyLog;

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (e.confidence < appliedFilters.confMin) return false;
      if (appliedFilters.search) {
        const q = appliedFilters.search.toLowerCase();
        if (!e.timestamp.includes(q)) return false;
      }
      if (appliedFilters.dateFrom && e.timestamp < appliedFilters.dateFrom) return false;
      // dateTo 당일 전체를 포함하기 위해 " 23:59:59" 접미사를 붙여 비교
      if (appliedFilters.dateTo && e.timestamp > appliedFilters.dateTo + " 23:59:59") return false;
      return true;
    });
  }, [entries, appliedFilters]);

  const selectedEntry = selectedIdx !== null ? (filteredEntries[selectedIdx] ?? null) : null;

  function getStatus(entry: DetectionLogEntry): RowStatus {
    return statusOverride[entry.timestamp] ?? "Confirmed";
  }

  function handleApplyFilter() {
    setAppliedFilters(pendingFilters);
    setSelectedIdx(null);
  }

  const handleMarkFalsePositive = useCallback(() => {
    if (!selectedEntry) return;
    setStatusOverride((prev) => {
      const next = { ...prev, [selectedEntry.timestamp]: "FalsePositive" as RowStatus };
      // 페이지 새로고침 후에도 오버라이드 유지
      saveFpOverrides(next);
      return next;
    });
  }, [selectedEntry]);

  return (
    <main className="grid min-h-0 flex-1 grid-cols-[380px_minmax(0,1fr)_380px] gap-3 overflow-hidden p-3">
      {/* Filter Sidebar */}
      <FilterBar
        filters={pendingFilters}
        fetchStatus={fetchStatus}
        onChange={setPendingFilters}
        onApply={handleApplyFilter}
      />

      {/* Detection Table */}
      <section className="flex min-h-0 flex-col overflow-hidden">
        <DetectionTable
          entries={filteredEntries}
          selectedIdx={selectedIdx}
          getStatus={getStatus}
          onSelect={setSelectedIdx}
        />
      </section>

      {/* Detail Modal */}
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
