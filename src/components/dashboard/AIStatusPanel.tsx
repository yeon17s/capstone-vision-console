interface StatusCellProps {
  label: string;
  value: string;
  valueClass?: string;
}

function getFrameDelayTone(frameDelayMs: number): string {
  if (frameDelayMs <= 60) return "text-mission-active";
  if (frameDelayMs <= 120) return "text-mission-suspicious";
  return "text-mission-critical";
}

function StatusCell({ label, value, valueClass = "text-mission-text" }: StatusCellProps) {
  return (
    <div className="flex min-h-[88px] flex-col items-center justify-center gap-1 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mission-text">{label}</p>
      <p className={`font-mono text-[15px] font-black uppercase ${valueClass}`}>{value}</p>
    </div>
  );
}

export default function AIStatusPanel() {
  const frameDelayMs = 48;
  const frameDelayToneClass = getFrameDelayTone(frameDelayMs);

  return (
    <div className="shrink-0 rounded-[18px] border border-mission-border bg-mission-panel shadow-mission-soft">
      <div className="grid grid-cols-6 divide-x divide-mission-border">
        {/* Last Detected */}
        <StatusCell label="Last Detected" value="person" valueClass="text-mission-text" />

        {/* Confidence */}
        <StatusCell label="Confidence" value="98.5%" valueClass="text-mission-active" />

        {/* Current Mode */}
        <StatusCell label="Current Mode" value="Manual" valueClass="text-mission-info" />

        {/* Frame Delay + FPS */}
        <div className="flex min-h-[88px] flex-col items-center justify-center gap-1 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mission-text">Frame Delay</p>
          <p className={`font-mono text-[15px] font-black ${frameDelayToneClass}`}>{frameDelayMs}ms</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-mission-text">FPS: 20.5</p>
        </div>

        {/* Freeze Frame */}
        <div className="flex min-h-[88px] flex-col items-center justify-center gap-1.5 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mission-text">Freeze Frame</p>
          <button
            type="button"
            className="rounded-md border border-mission-border bg-mission-bg px-4 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-mission-text transition hover:border-mission-text"
          >
            FREEZE
          </button>
        </div>

        {/* Visual Mode */}
        <div className="flex min-h-[88px] flex-col items-center justify-center gap-1 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mission-text">Visual Mode</p>
          <div className="rounded-md border border-mission-border bg-mission-bg px-3 py-1">
            <p className="font-mono text-[15px] font-black text-mission-text">RGB</p>
          </div>
        </div>
      </div>

      {/* Footer label */}
      <div className="border-t border-mission-border px-4 py-1.5">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.32em] text-mission-text">
          AI Detection Status Panel
        </p>
      </div>
    </div>
  );
}
