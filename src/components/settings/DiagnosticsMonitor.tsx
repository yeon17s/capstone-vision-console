import Typography from "../ui/Typography";
import MissionPanel, { MissionCard } from "../ui/MissionPanel";
import StatusIndicator from "../ui/StatusIndicator";

type DiagStatus = "active" | "warning" | "error" | "unknown";

interface DiagItem {
  label: string;
  detail: string;
  status: DiagStatus;
}

const DIAG_ITEMS: DiagItem[] = [
  { label: "Robot Connection",     detail: "Ping: <1 ms",  status: "active" },
  { label: "ROS Bridge",           detail: "Connected",    status: "active" },
  { label: "FastAPI Backend",      detail: "Reachable",    status: "active" },
  { label: "WebSocket",            detail: "Open",         status: "active" },
  { label: "AI Model",             detail: "Loaded",       status: "active" },
];

const DOT_TONE: Record<DiagStatus, "success" | "warning" | "danger" | "muted"> = {
  active: "success",
  warning: "warning",
  error: "danger",
  unknown: "muted",
};

const BADGE_TONE: Record<DiagStatus, "success" | "warning" | "danger" | "muted"> = {
  active: "success",
  warning: "warning",
  error: "danger",
  unknown: "muted",
};

export default function DiagnosticsMonitor() {
  return (
    <MissionPanel title="Diagnostics Monitor" bodyClassName="space-y-1.5 p-4">
        {DIAG_ITEMS.map(({ label, detail, status }) => (
          <MissionCard
            key={label}
            className="bg-mission-panel/10 px-3 py-2"
          >
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <StatusIndicator tone={DOT_TONE[status]} size="md" />
              <Typography as="span" variant="control" className="font-medium uppercase tracking-[0.08em]">{label}</Typography>
            </div>
            <StatusIndicator tone={BADGE_TONE[status]} label={detail} showDot={false} textVariant="monoStrong" className="uppercase tracking-[0.08em]" />
            </div>
          </MissionCard>
        ))}
    </MissionPanel>
  );
}
