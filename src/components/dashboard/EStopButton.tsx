export default function EStopButton() {
  return (
    <button
      type="button"
      className="w-full rounded-[18px] border-2 border-mission-critical bg-mission-critical py-6 shadow-mission-glow-red transition hover:brightness-110 active:scale-95"
    >
      <p className="text-[22px] font-black uppercase tracking-[0.12em] text-mission-bg">
        E-STOP
      </p>
      <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.26em] text-mission-bg">
        Emergency Stop
      </p>
    </button>
  );
}
