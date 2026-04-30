import Typography from "../ui/Typography";
import MissionPanel, { MissionCard } from "../ui/MissionPanel";
import StatusIndicator from "../ui/StatusIndicator";
import useRobotStore from "../../store/robotStore";

type DiagStatus = "active" | "warning" | "error" | "unknown";

interface DiagItem {
  label: string;
  detail: string;
  status: DiagStatus;
}

const DOT_TONE: Record<DiagStatus, "success" | "warning" | "danger" | "muted"> = {
  active:  "success",
  warning: "warning",
  error:   "danger",
  unknown: "muted",
};

function connStatus(connected: boolean): { status: DiagStatus; detail: string } {
  return connected
    ? { status: "active",  detail: "Connected" }
    : { status: "error",   detail: "Disconnected" };
}

export default function DiagnosticsMonitor() {
  const rosConnected    = useRobotStore((s) => s.rosConnected);
  const aiConnected     = useRobotStore((s) => s.aiConnected);
  const cameraConnected = useRobotStore((s) => s.cameraConnected);

  const items: DiagItem[] = [
    { label: "ROS Bridge",      ...connStatus(rosConnected) },
    { label: "AI Stream",       ...connStatus(aiConnected) },
    { label: "Camera",          ...connStatus(cameraConnected) },
  ];

  return (
    <MissionPanel title="Diagnostics Monitor" bodyClassName="space-y-1.5 p-4" borderTone="mvp">
      {items.map(({ label, detail, status }) => (
        <MissionCard key={label} className="bg-mission-panel/10 px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <StatusIndicator tone={DOT_TONE[status]} size="md" />
              <Typography as="span" variant="control" className="font-medium uppercase tracking-[0.08em]">
                {label}
              </Typography>
            </div>
            <StatusIndicator
              tone={DOT_TONE[status]}
              label={detail}
              showDot={false}
              textVariant="monoStrong"
              className="uppercase tracking-[0.08em]"
            />
          </div>
        </MissionCard>
      ))}
    </MissionPanel>
  );
}
