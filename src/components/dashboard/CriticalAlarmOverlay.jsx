function CriticalAlarmOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-red-500/60">
      <span className="absolute right-3 top-3 rounded bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-100">
        Critical Alarm
      </span>
    </div>
  );
}

export default CriticalAlarmOverlay;
