import Typography from "../ui/Typography";
import MissionPanel, { MissionCard } from "../ui/MissionPanel";

interface AlertItem {
  id: number;
  cls: string;
  conf: number;
  timestamp: string;
  status: "Confirmed" | "Pending";
}

const MOCK_ALERTS: AlertItem[] = [
  { id: 1, cls: "person", conf: 98.5, timestamp: "2026-03-29 19:30:12", status: "Confirmed" },
  { id: 2, cls: "person", conf: 91.2, timestamp: "2026-03-29 19:28:45", status: "Confirmed" },
  { id: 3, cls: "dog",    conf: 76.4, timestamp: "2026-03-29 19:25:03", status: "Pending" },
  { id: 4, cls: "person", conf: 88.9, timestamp: "2026-03-29 19:21:57", status: "Confirmed" },
];

const DOT_COLOR: Record<AlertItem["status"], string> = {
  Confirmed: "bg-mission-active",
  Pending:   "bg-mission-suspicious",
};

const STATUS_STYLE: Record<AlertItem["status"], string> = {
  Confirmed: "text-mission-active",
  Pending:   "text-mission-suspicious",
};

export default function AlertFeed() {
  return (
    <MissionPanel
      className="flex-1"
      title="Real-Time Alert Feed"
      headerRight={<span className="h-2 w-2 animate-pulse rounded-full bg-mission-active shadow-mission-glow-green" />}
      bodyClassName="flex-1 space-y-2 overflow-y-auto p-3"
      footer={
        <div className="flex gap-5">
          <Typography as="span" variant="overline" tone="success" className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-mission-active" />Confirmed
          </Typography>
          <Typography as="span" variant="overline" tone="warning" className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-mission-suspicious" />Pending
          </Typography>
        </div>
      }
    >
        {MOCK_ALERTS.map((a) => (
          <MissionCard key={a.id}>
            <div className="flex items-start gap-3">
              <div className="h-16 w-16 shrink-0 rounded-md border border-mission-border bg-mission-panel" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <Typography as="span" variant="monoStrong" className="text-mission-overline font-medium">{a.timestamp}</Typography>
                  <Typography as="span" variant="display" className={STATUS_STYLE[a.status]}>
                    {a.conf}%
                  </Typography>
                </div>

                <div className="flex items-center gap-3">
                  <Typography as="span" variant="emphasis" className="capitalize">{a.cls}</Typography>
                  <span className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[a.status]}`} />
                  <Typography as="span" variant="overline" className={STATUS_STYLE[a.status]}>
                    {a.status}
                  </Typography>
                </div>

                <Typography variant="control">Location: X 1.2, Y -0.5</Typography>
              </div>
            </div>
          </MissionCard>
        ))}
    </MissionPanel>
  );
}
