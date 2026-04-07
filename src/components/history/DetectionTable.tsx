import type { DetectionLogEntry } from "../../store/robotStore";
import type { RowStatus } from "../../pages/History";

interface DetectionTableProps {
  entries: DetectionLogEntry[];
  selectedIdx: number | null;
  getStatus: (entry: DetectionLogEntry) => RowStatus;
  onSelect: (idx: number) => void;
}

function confColor(conf: number): string {
  if (conf >= 0.85) return "text-mission-secondary";
  if (conf >= 0.70) return "text-mission-suspicious";
  return "text-mission-text/60";
}

const STATUS_STYLE: Record<RowStatus, string> = {
  Confirmed:    "text-mission-secondary",
  Pending:      "text-mission-suspicious",
  FalsePositive: "text-mission-text/40 line-through",
};

const COLS = ["Timestamp", "Conf (%)", "Class", "Mode", "Status"];

export default function DetectionTable({ entries, selectedIdx, getStatus, onSelect }: DetectionTableProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-mission-border bg-mission-panel">
      <div className="flex items-center justify-between border-b border-mission-border px-4 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-mission-text/50">
          Detection Log
        </p>
        <span className="font-mono text-[11px] text-mission-text/30">{entries.length} records</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-mission-text/30">No records match current filters</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-mission-panel">
              <tr className="border-b border-mission-border">
                {COLS.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2 text-left font-semibold uppercase tracking-wider text-mission-text/40"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((row, i) => {
                const status = getStatus(row);
                const isSelected = i === selectedIdx;
                return (
                  <tr
                    key={`${row.timestamp}-${i}`}
                    onClick={() => onSelect(i)}
                    className={[
                      "cursor-pointer border-b border-mission-border/40 transition-colors hover:bg-mission-border/20",
                      isSelected ? "bg-mission-info/5 ring-1 ring-inset ring-mission-info/50" : "",
                    ].join(" ")}
                  >
                    <td className="px-4 py-2 font-mono text-mission-text/80">{row.timestamp}</td>
                    <td className={`px-4 py-2 font-mono font-semibold ${confColor(row.confidence)}`}>
                      {(row.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 capitalize text-mission-text">{row.class}</td>
                    <td className="px-4 py-2 text-mission-info/80">{row.mode ?? "RGB"}</td>
                    <td className={`px-4 py-2 font-semibold ${STATUS_STYLE[status]}`}>{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
