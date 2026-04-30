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
  // conf is 0–100 percent scale
  const pct = conf;
  const dash = pct.toFixed(1);
  const gap = (100 - pct).toFixed(1);
  const color =
    conf >= 85 ? "#22c55e" : conf >= 70 ? "#eab308" : "#94a3b8";

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

export default function DetailModal({ entry, status }: DetailModalProps) {
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
          {!isFalsePositive && (
            <Button variant="dangerOutline" size="sm" className="px-2 py-0.5">
              <Typography as="span" variant="overline" tone="danger" className="font-bold">False Positive</Typography>
            </Button>
          )}
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
              tone={entry.frameDelayMs <= 200 ? "success" : entry.frameDelayMs <= 500 ? "warning" : "danger"}
              label={`${entry.frameDelayMs} ms`}
              showDot={false}
              textVariant="monoStrong"
            />
          </div>
        </div>

        {/* Image comparison */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded border border-mission-border bg-mission-bg">
              {entry.snapshotOriginal ? (
                <img src={entry.snapshotOriginal} alt="Original (Detection Moment)" className="h-full w-full object-cover" />
              ) : (
                <Typography as="p" variant="overline" className="text-center text-mission-text/30">
                  No Image
                </Typography>
              )}
            </div>
            <Typography as="span" variant="overline" className="text-mission-text/30">
              Original<br />(Detection Moment)
            </Typography>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded border border-mission-border bg-mission-bg">
              {entry.snapshotInverted ? (
                <img src={entry.snapshotInverted} alt="Inverted (Detection Moment)" className="h-full w-full object-cover" style={{ filter: "invert(1) hue-rotate(180deg)" }} />
              ) : (
                <Typography as="p" variant="overline" className="text-center text-mission-text/30">
                  No Image
                </Typography>
              )}
            </div>
            <Typography as="span" variant="overline" className="text-mission-text/30">
              Inverted<br />(Detection Moment)
            </Typography>
          </div>
        </div>
    </MissionPanel>
  );
}
