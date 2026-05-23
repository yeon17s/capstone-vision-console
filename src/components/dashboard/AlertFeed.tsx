import Typography from "../ui/Typography";
import MissionPanel, { MissionCard } from "../ui/MissionPanel";
import StatusIndicator from "../ui/StatusIndicator";
import StatusBadge from "../ui/StatusBadge";
import useRobotStore, { type DetectionLogEntry } from "../../store/robotStore";
import { confTone } from "../../lib/confidenceTone";

function AlertCard({ entry }: { entry: DetectionLogEntry }) {
  const tone = confTone(entry.confidence);
  return (
    <MissionCard>
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-mission-border bg-mission-panel">
          {entry.snapshotOriginal && (
            <img src={entry.snapshotOriginal} alt="snapshot" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <Typography as="span" variant="monoStrong" className="text-mission-overline font-medium">
              {entry.timestamp}
            </Typography>
            <StatusIndicator
              tone={tone}
              label={`${entry.confidence.toFixed(1)}%`}
              showDot={false}
              textVariant="overline"
            />
          </div>

          <div className="flex items-center gap-2">
            <Typography as="span" variant="emphasis" className="text-mission-critical">Detected</Typography>
            <StatusIndicator tone={tone} />
          </div>

          {entry.pose ? (
            <Typography variant="control" className="text-mission-text/60">
              X: {entry.pose.x.toFixed(2)} / Y: {entry.pose.y.toFixed(2)}
            </Typography>
          ) : (
            <Typography variant="control" className="text-mission-text/30">Location unavailable</Typography>
          )}
        </div>
      </div>
    </MissionCard>
  );
}

export default function AlertFeed() {
  const detectionLog = useRobotStore((s) => s.recentLog);

  return (
    <MissionPanel
      className="flex-1"
      title="Real-Time Alert Feed"
      headerRight={<StatusIndicator tone="success" size="md" pulse />}
      bodyClassName="flex-1 space-y-2 overflow-y-auto p-3"
      footer={
        <div className="flex gap-5">
          <div className="flex items-center gap-2">
            <StatusIndicator tone="success" />
            <StatusBadge tone="success" className="border-0 bg-transparent px-0 py-0">High</StatusBadge>
          </div>
          <div className="flex items-center gap-2">
            <StatusIndicator tone="warning" />
            <StatusBadge tone="warning" className="border-0 bg-transparent px-0 py-0">Medium</StatusBadge>
          </div>
        </div>
      }
    >
      {detectionLog.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <Typography variant="control" className="text-mission-text/30">No detections yet</Typography>
        </div>
      ) : (
        detectionLog.map((entry, i) => (
          <AlertCard key={`${entry.timestamp}-${i}`} entry={entry} />
        ))
      )}
    </MissionPanel>
  );
}
