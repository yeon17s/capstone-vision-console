export default function DriveModeControl() {
  return (
    <div className="rounded-[18px] border border-mission-border bg-mission-panel shadow-mission-soft">
      <div className="border-b border-mission-border px-5 py-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-mission-text">
          Drive Mode
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-lg border border-mission-border bg-mission-bg py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-mission-text transition hover:border-mission-info hover:text-mission-info"
          >
            Auto Patrol
          </button>
          <button
            type="button"
            className="rounded-lg border border-mission-info bg-mission-info py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-mission-bg shadow-mission-glow-blue"
          >
            Manual Mode
          </button>
        </div>
      </div>
    </div>
  )
}
