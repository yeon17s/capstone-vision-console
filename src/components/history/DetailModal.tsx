import type { DetectionLogEntry } from "../../store/robotStore";
import type { RowStatus } from "../../pages/History";
import { detectionLabel } from "../../lib/detectionLabel";
import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";
import StatusBadge from "../ui/StatusBadge";
import StatusIndicator from "../ui/StatusIndicator";


interface DetailModalProps {
  entry: DetectionLogEntry | null;
  status: RowStatus;
  onMarkFalsePositive: () => void;
  onClose: () => void;
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
      <Typography as="span" variant="overline" tone="subtle" className="min-w-[110px]">
        {label}
      </Typography>
      <Typography
        as="span"
        variant={mono ? "mono" : "control"}
        tone={accent ? "info" : "default"}
        className={mono ? "text-mission-text/80" : "font-medium text-mission-text/80"}
      >
        {value}
      </Typography>
    </div>
  );
}

function ConfidenceDonut({ conf }: { conf: number }) {
  const pct = conf;
  const dash = pct.toFixed(1);
  const gap = (100 - pct).toFixed(1);
  const color =
    conf >= 85 ? "#22c55e" : conf >= 70 ? "#eab308" : "#94a3b8";

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg viewBox="0 0 36 36" className="h-32 w-32 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3.8" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color}
            strokeWidth="3.8"
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
          />
        </svg>
        <Typography as="span" variant="emphasis" className="absolute font-mono font-bold" style={{ color }}>
          {pct.toFixed(1)}%
        </Typography>
      </div>
      <Typography variant="overline" tone="subtle">Confidence</Typography>
    </div>
  );
}

function SnapshotCell({ url, alt }: { url?: string; alt: string }) {
  if (url) {
    return <img src={url} alt={alt} className="h-full w-full object-cover" />;
  }
  return (
    <Typography as="p" variant="overline" className="text-center text-mission-text/30 px-2">
      No Image Available
    </Typography>
  );
}

const STATUS_LABEL: Record<RowStatus, { label: string; tone: "success" | "warning" | "muted" }> = {
  Confirmed:     { label: "Confirmed", tone: "success" },
  Pending:       { label: "Pending Review", tone: "warning" },
  FalsePositive: { label: "False Positive", tone: "muted" },
};

export default function DetailModal({ entry, status, onMarkFalsePositive, onClose }: DetailModalProps) {
  if (!entry) {
    return (
      <MissionPanel className="h-full" bodyClassName="flex h-full items-center justify-center py-6">
        <Typography variant="control" className="text-mission-text/30">Select a row to view details</Typography>
      </MissionPanel>
    );
  }

  const { label: statusLabel, tone: statusTone } = STATUS_LABEL[status];
  const isFalsePositive = status === "FalsePositive";

  return (
    <MissionPanel
      className="h-full"
      title="Detail View"
      headerRight={
        <div className="flex items-center gap-2">
          <StatusBadge tone={statusTone}>
            {statusLabel}
          </StatusBadge>
          <Button variant="dangerOutline" size="sm" className="px-2 py-0.5" onClick={onMarkFalsePositive}>
            <Typography as="span" variant="overline" tone="danger" className="font-bold">
              {isFalsePositive ? "Undo False Positive" : "False Positive"}
            </Typography>
          </Button>
          <button
            onClick={onClose}
            className="ml-1 flex h-5 w-5 items-center justify-center rounded text-mission-text/40 hover:text-mission-text/80 transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5">
              <line x1="3" y1="3" x2="13" y2="13" />
              <line x1="13" y1="3" x2="3" y2="13" />
            </svg>
          </button>
        </div>
      }
      bodyClassName="grid h-full grid-cols-1 grid-rows-[auto_auto_1fr] items-start gap-5 p-4"
    >
        {/* Confidence donut */}
        <div className="flex items-center justify-center">
          <ConfidenceDonut conf={entry.confidence} />
        </div>

        {/* Metadata */}
        <div className="flex flex-col gap-2 rounded-[16px] border border-mission-border bg-mission-bg px-4 py-3">
          <MetaRow label="Timestamp"   value={entry.timestamp} mono />
          <MetaRow label="Detection" value={detectionLabel(entry.class).full} accent />
          <div className="flex items-baseline gap-2">
            <Typography as="span" variant="overline" tone="subtle" className="min-w-[110px]">
              FPS
            </Typography>
            <StatusIndicator tone="info" label={entry.fps.toFixed(1)} showDot={false} textVariant="monoStrong" />
          </div>
          <div className="flex items-baseline gap-2">
            <Typography as="span" variant="overline" tone="subtle" className="min-w-[110px]">
              Frame Delay
            </Typography>
            <StatusIndicator
              tone={entry.frameDelayMs <= 200 ? "success" : entry.frameDelayMs <= 500 ? "warning" : "danger"}
              label={`${entry.frameDelayMs} ms`}
              showDot={false}
              textVariant="monoStrong"
            />
          </div>
        </div>

        {/* Image Display */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-72 w-full items-center justify-center overflow-hidden rounded border border-mission-border bg-mission-bg">
            <SnapshotCell
              url={entry.snapshot_url}
              alt="Snapshot at detection moment"
            />
          </div>
          <Typography as="span" variant="overline" className="text-mission-text/30">
            Detection Snapshot
          </Typography>
        </div>
    </MissionPanel>
  );
}