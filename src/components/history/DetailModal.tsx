import type { DetectionLogEntry } from "../../store/robotStore";
import type { RowStatus } from "../../pages/History";

interface DetailModalProps {
  entry: DetectionLogEntry | null;
  status: RowStatus;
  onMarkFalsePositive: () => void;
}

interface MetaRowProps {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}

function MetaRow({ label, value, mono = false, accent = false }: MetaRowProps) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="min-w-[110px] text-[11px] text-mission-text/40">{label}</span>
      <span
        className={[
          mono ? "font-mono text-[11px]" : "text-xs",
          accent ? "text-mission-info" : "text-mission-text/80",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function ConfidenceDonut({ conf }: { conf: number }) {
  const pct = conf * 100;
  const dash = pct.toFixed(1);
  const gap = (100 - pct).toFixed(1);
  const color =
    conf >= 0.85 ? "#22c55e" : conf >= 0.70 ? "#eab308" : "#94a3b8";

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3.8" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color}
            strokeWidth="3.8"
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute font-mono text-sm font-bold" style={{ color }}>
          {pct.toFixed(1)}%
        </span>
      </div>
      <p className="text-[10px] uppercase tracking-wider text-mission-text/40">Confidence</p>
    </div>
  );
}

const STATUS_LABEL: Record<RowStatus, { label: string; cls: string }> = {
  Confirmed:     { label: "Confirmed",      cls: "text-mission-secondary border-mission-secondary/40 bg-mission-secondary/5" },
  Pending:       { label: "Pending Review", cls: "text-mission-suspicious border-mission-suspicious/40 bg-mission-suspicious/5" },
  FalsePositive: { label: "False Positive", cls: "text-mission-text/40 border-mission-border bg-mission-border/10" },
};

export default function DetailModal({ entry, status, onMarkFalsePositive }: DetailModalProps) {
  if (!entry) {
    return (
      <div className="flex shrink-0 items-center justify-center rounded-xl border border-mission-border bg-mission-panel py-6">
        <p className="text-xs text-mission-text/30">Select a row to view details</p>
      </div>
    );
  }

  const { label: statusLabel, cls: statusCls } = STATUS_LABEL[status];
  const isFalsePositive = status === "FalsePositive";

  return (
    <div className="shrink-0 rounded-xl border border-mission-border bg-mission-panel">
      <div className="flex items-center justify-between border-b border-mission-border px-4 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-mission-text/50">
          Detail View
        </p>
        <div className="flex items-center gap-2">
          <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusCls}`}>
            {statusLabel}
          </span>
          {!isFalsePositive && (
            <button
              type="button"
              onClick={onMarkFalsePositive}
              className="rounded border border-mission-critical/40 bg-mission-critical/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mission-critical transition-colors hover:bg-mission-critical/15"
            >
              False Positive
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4 p-4">
        {/* Confidence donut */}
        <ConfidenceDonut conf={entry.confidence} />

        {/* Metadata */}
        <div className="flex flex-col justify-center gap-1.5">
          <MetaRow label="Timestamp"   value={entry.timestamp} mono />
          <MetaRow label="Class"       value={entry.class} />
          <MetaRow label="Mode"        value={entry.mode ?? "RGB"} accent />
          <MetaRow label="BBox"        value={`{${entry.bbox.x}, ${entry.bbox.y}, ${entry.bbox.w}, ${entry.bbox.h}}`} mono />
          <MetaRow label="FPS"         value={entry.fps.toFixed(1)} mono />
          <MetaRow label="Frame Delay" value={`${entry.frameDelayMs} ms`} mono />
        </div>

        {/* Image comparison */}
        <div className="flex gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-20 w-24 items-center justify-center overflow-hidden rounded border border-mission-border bg-mission-bg">
              <p className="text-center text-[10px] text-mission-text/30">
                A. Original<br />Photo
              </p>
            </div>
            <span className="text-[10px] text-mission-text/30">Original</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div
              className="flex h-20 w-24 items-center justify-center overflow-hidden rounded border border-mission-border bg-mission-bg"
              style={{ filter: "invert(1) hue-rotate(180deg)" }}
            >
              <p className="text-center text-[10px]" style={{ filter: "invert(1) hue-rotate(180deg)" }}>
                B. Inverted<br />Photo
              </p>
            </div>
            <span className="text-[10px] text-mission-text/30">Inverted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
