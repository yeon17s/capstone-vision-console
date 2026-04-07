import type { DetectionLogEntry } from "../../store/robotStore";
import type { RowStatus } from "../../pages/History";
import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";

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
    <MissionPanel
      className="flex-1"
      title="Detection Log"
      headerRight={<Typography as="span" variant="monoStrong" className="text-mission-text/40">{entries.length} records</Typography>}
      bodyClassName="min-h-0 flex-1 overflow-y-auto p-0"
      compactBody
    >
        {entries.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Typography variant="control" className="text-mission-text/30">No records match current filters</Typography>
          </div>
        ) : (
          <table className="w-full text-mission-control">
            <thead className="sticky top-0 bg-mission-panel">
              <tr className="border-b border-mission-border">
                {COLS.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2 text-left"
                  >
                    <Typography as="span" variant="overline" tone="subtle" className="font-bold tracking-[0.14em]">{col}</Typography>
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
                    <td className="px-4 py-2"><Typography as="span" variant="mono" className="text-mission-text/90">{row.timestamp}</Typography></td>
                    <td className="px-4 py-2"><Typography as="span" variant="monoStrong" className={confColor(row.confidence)}>{(row.confidence * 100).toFixed(1)}%</Typography></td>
                    <td className="px-4 py-2"><Typography as="span" variant="control" className="font-medium capitalize">{row.class}</Typography></td>
                    <td className="px-4 py-2"><Typography as="span" variant="mono" tone="info" className="uppercase tracking-[0.08em] text-mission-info/90">{row.mode ?? "RGB"}</Typography></td>
                    <td className="px-4 py-2"><Typography as="span" variant="overline" className={`font-bold tracking-[0.08em] ${STATUS_STYLE[status]}`}>{status}</Typography></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
    </MissionPanel>
  );
}
