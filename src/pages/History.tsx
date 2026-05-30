import { useState, useMemo, useEffect, useCallback } from "react";
import useRobotStore, { type DetectionLogEntry } from "../store/robotStore";
import useSettingsStore from "../store/settingsStore";
import DetailModal from "../components/history/DetailModal";
import DetectionTable from "../components/history/DetectionTable";
import FilterBar from "../components/history/FilterBar";
import { fetchHistoryLog, fetchHistoryCount } from "../lib/historyApi";

export type RowStatus = "Confirmed" | "Pending" | "FalsePositive";

const MOCK_ENTRY: import("../store/robotStore").DetectionLogEntry = {
  timestamp: "2025-05-26 09:31:07",
  class: "cod",
  confidence: 87.4,
  bbox: { x: 142, y: 98, w: 210, h: 315 },
  fps: 29.6,
  frameDelayMs: 34,
  pose: { x: 1.25, y: -0.43, yaw: 0.17 },
  snapshot_url: undefined,
};

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
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [pendingFilters, setPendingFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);
  const [statusOverride, setStatusOverride] = useState<Record<string, RowStatus>>(loadFpOverrides);

  useEffect(() => {
    // cancelled 플래그: fastapiUrl 변경 시 이전 요청 결과가 늦게 도착해도 무시
    let cancelled = false;
    setFetchStatus("loading");
    Promise.all([fetchHistoryLog(fastapiUrl), fetchHistoryCount(fastapiUrl)])
      .then(([entries, total]) => {
        if (cancelled) return;
        mergeHistoryLog(entries);
        setTotalCount(total);
        setFetchStatus("idle");
      })
      .catch(() => {
        if (cancelled) return;
        setFetchStatus("error");
      });
    return () => { cancelled = true; };
  }, [fastapiUrl, mergeHistoryLog]);

  // 테이블 표시용: 실 데이터 없으면 mock 한 줄 보여줌
  const entries: DetectionLogEntry[] = historyLog.length > 0 ? historyLog : [MOCK_ENTRY];
  // 내보내기용: mock 제외, 실 데이터만
  const hasMock = historyLog.length === 0;

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
  // mock 행은 내보내기 제외 — mock일 때 exportEntries는 항상 빈 배열
  const exportEntries = hasMock ? [] : filteredEntries;

  function getStatus(entry: DetectionLogEntry): RowStatus {
    return statusOverride[entry.timestamp] ?? "Confirmed";
  }

  function handleApplyFilter() {
    setAppliedFilters(pendingFilters);
    setSelectedIdx(null);
  }

  function handleExportCsv() {
    const headers = ["Timestamp", "Class", "Confidence (%)", "FPS", "Frame Delay (ms)", "Pose X", "Pose Y", "Pose Yaw", "Status"];
    const rows = exportEntries.map((e) => [
      e.timestamp,
      e.class,
      e.confidence.toFixed(1),
      e.fps.toFixed(1),
      String(e.frameDelayMs),
      e.pose?.x.toFixed(3) ?? "",
      e.pose?.y.toFixed(3) ?? "",
      e.pose?.yaw.toFixed(3) ?? "",
      getStatus(e),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `detection-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  const handleMarkFalsePositive = useCallback(() => {
    if (!selectedEntry) return;
    setStatusOverride((prev) => {
      let next: Record<string, RowStatus>;
      if (prev[selectedEntry.timestamp] === "FalsePositive") {
        const { [selectedEntry.timestamp]: _, ...rest } = prev;
        next = rest;
      } else {
        next = { ...prev, [selectedEntry.timestamp]: "FalsePositive" };
      }
      saveFpOverrides(next);
      return next;
    });
  }, [selectedEntry]);

  const showDetail = selectedIdx !== null;

  return (
    <main
      className={`grid min-h-0 flex-1 gap-3 overflow-hidden p-3 ${
        showDetail
          ? "grid-cols-[380px_minmax(0,1fr)_450px]"
          : "grid-cols-[380px_minmax(0,1fr)]"
      }`}
    >
      {/* Filter Sidebar */}
      <FilterBar
        filters={pendingFilters}
        fetchStatus={fetchStatus}
        onChange={setPendingFilters}
        onApply={handleApplyFilter}
        onExport={handleExportCsv}
        exportCount={exportEntries.length}
      />

      {/* Detection Table */}
      <section className="flex min-h-0 flex-col overflow-hidden">
        <DetectionTable
          entries={filteredEntries}
          selectedIdx={selectedIdx}
          getStatus={getStatus}
          onSelect={setSelectedIdx}
          totalCount={totalCount ?? undefined}
        />
      </section>

      {/* Detail Modal */}
      {showDetail && (
        <aside className="min-h-0 overflow-hidden">
          <DetailModal
            entry={selectedEntry}
            status={selectedEntry ? getStatus(selectedEntry) : "Confirmed"}
            onMarkFalsePositive={handleMarkFalsePositive}
            onClose={() => setSelectedIdx(null)}
          />
        </aside>
      )}
    </main>
  );
}
