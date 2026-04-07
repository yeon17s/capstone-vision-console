import Typography from "../ui/Typography";
import MissionPanel, { MissionCard } from "../ui/MissionPanel";

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

const DOT: Record<DiagStatus, string> = {
  active:  "bg-mission-active  shadow-[0_0_6px_var(--color-accent-green)]",
  warning: "bg-mission-suspicious",
  error:   "bg-mission-critical",
  unknown: "bg-mission-text/20",
};

const TEXT: Record<DiagStatus, string> = {
  active:  "text-mission-active",
  warning: "text-mission-suspicious",
  error:   "text-mission-critical",
  unknown: "text-mission-text/30",
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
              <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[status]}`} />
              <Typography as="span" variant="control" className="font-medium uppercase tracking-[0.08em]">{label}</Typography>
            </div>
            <Typography as="span" variant="monoStrong" className={`uppercase tracking-[0.08em] ${TEXT[status]}`}>{detail}</Typography>
            </div>
          </MissionCard>
        ))}
    </MissionPanel>
  );
}
