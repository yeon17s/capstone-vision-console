import type { DetectionLogEntry } from "../../store/robotStore";
import type { RowStatus } from "../../pages/History";
import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";
import StatusBadge from "../ui/StatusBadge";
import StatusIndicator from "../ui/StatusIndicator";

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
        <Typography as="span" variant="emphasis" className="absolute font-mono font-bold" style={{ color }}>
          {pct.toFixed(1)}%
        </Typography>
      </div>
      <Typography variant="overline" tone="subtle">Confidence</Typography>
    </div>
  );
}

const STATUS_LABEL: Record<RowStatus, { label: string; tone: "success" | "warning" | "muted" }> = {
  Confirmed:     { label: "Confirmed", tone: "success" },
  Pending:       { label: "Pending Review", tone: "warning" },
  FalsePositive: { label: "False Positive", tone: "muted" },
};

export default function DetailModal({ entry, status, onMarkFalsePositive }: DetailModalProps) {
  if (!entry) {
    return (
      <MissionPanel className="shrink-0" bodyClassName="flex items-center justify-center py-6">
        <Typography variant="control" className="text-mission-text/30">Select a row to view details</Typography>
      </MissionPanel>
    );
  }

  const { label: statusLabel, tone: statusTone } = STATUS_LABEL[status];
  const isFalsePositive = status === "FalsePositive";

  return (
    <MissionPanel
      className="shrink-0"
      title="Detail View"
      headerRight={
        <div className="flex items-center gap-2">
          <StatusBadge tone={statusTone}>
            {statusLabel}
          </StatusBadge>
          {!isFalsePositive && (
            <Button
              onClick={onMarkFalsePositive}
              variant="dangerOutline"
              size="sm"
              className="px-2 py-0.5"
            >
              <Typography as="span" variant="overline" tone="danger" className="font-bold">False Positive</Typography>
            </Button>
          )}
        </div>
      }
      bodyClassName="grid grid-cols-[auto_1fr_auto] items-start gap-4 p-4"
    >
        {/* Confidence donut */}
        <ConfidenceDonut conf={entry.confidence} />

        {/* Metadata */}
        <div className="flex flex-col justify-center gap-1.5">
          <MetaRow label="Timestamp"   value={entry.timestamp} mono />
          <MetaRow label="Class"       value={entry.class} />
          <MetaRow label="Mode"        value={entry.mode ?? "RGB"} accent />
          <MetaRow label="BBox"        value={`{${entry.bbox.x}, ${entry.bbox.y}, ${entry.bbox.w}, ${entry.bbox.h}}`} mono />
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
              tone={entry.frameDelayMs <= 60 ? "success" : entry.frameDelayMs <= 120 ? "warning" : "danger"}
              label={`${entry.frameDelayMs} ms`}
              showDot={false}
              textVariant="monoStrong"
            />
          </div>
        </div>

        {/* Image comparison */}
        <div className="flex gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-20 w-24 items-center justify-center overflow-hidden rounded border border-mission-border bg-mission-bg">
              <Typography as="p" variant="overline" className="text-center text-mission-text/30">
                A. Original<br />Photo
              </Typography>
            </div>
            <Typography as="span" variant="overline" className="text-mission-text/30">Original</Typography>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div
              className="flex h-20 w-24 items-center justify-center overflow-hidden rounded border border-mission-border bg-mission-bg"
              style={{ filter: "invert(1) hue-rotate(180deg)" }}
            >
              <Typography as="p" variant="overline" className="text-center" style={{ filter: "invert(1) hue-rotate(180deg)" }}>
                B. Inverted<br />Photo
              </Typography>
            </div>
            <Typography as="span" variant="overline" className="text-mission-text/30">Inverted</Typography>
          </div>
        </div>
    </MissionPanel>
  );
}
