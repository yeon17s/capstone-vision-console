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
    <section className="rounded border border-mission-border bg-mission-panel p-4">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-mission-text/50">
        Diagnostics Monitor
      </p>

      <div className="space-y-1.5">
        {DIAG_ITEMS.map(({ label, detail, status }) => (
          <div
            key={label}
            className="flex items-center justify-between rounded border border-mission-border/50 bg-mission-bg/60 px-3 py-2"
          >
            <div className="flex items-center gap-2.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[status]}`} />
              <span className="text-xs text-mission-text">{label}</span>
            </div>
            <span className={`font-mono text-[11px] ${TEXT[status]}`}>{detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
