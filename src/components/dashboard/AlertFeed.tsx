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
    <div className="flex min-h-0 flex-1 flex-col rounded-[18px] border border-mission-border bg-mission-panel shadow-mission-soft">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-mission-border px-5 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mission-text">
          Real-Time Alert Feed
        </p>
        <span className="h-2 w-2 animate-pulse rounded-full bg-mission-active shadow-mission-glow-green" />
      </div>

      {/* Alert cards */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {MOCK_ALERTS.map((a) => (
          <div
            key={a.id}
            className="rounded-lg border border-mission-border bg-mission-bg px-4 py-3 transition hover:border-mission-text"
          >
            <div className="flex items-start gap-3">
              <div className="h-16 w-16 shrink-0 rounded-md border border-mission-border bg-mission-panel" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] text-mission-text">{a.timestamp}</span>
                  <span className={`font-mono text-[22px] font-black ${STATUS_STYLE[a.status]}`}>
                    {a.conf}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold capitalize text-mission-text">{a.cls}</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[a.status]}`} />
                  <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${STATUS_STYLE[a.status]}`}>
                    {a.status}
                  </span>
                </div>

                <p className="text-[11px] text-mission-text">Location: X 1.2, Y -0.5</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-5 border-t border-mission-border px-4 py-2">
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-mission-active">
          <span className="h-1.5 w-1.5 rounded-full bg-mission-active" />Confirmed
        </span>
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-mission-suspicious">
          <span className="h-1.5 w-1.5 rounded-full bg-mission-suspicious" />Pending
        </span>
      </div>
    </div>
  );
}
