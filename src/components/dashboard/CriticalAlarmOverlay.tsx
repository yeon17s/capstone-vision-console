import useRobotStore from "../../store/robotStore";
import useSettingsStore from "../../store/settingsStore";

export default function CriticalAlarmOverlay() {
  const detection = useRobotStore((s) => s.detection);
  const threshold = useSettingsStore((s) => s.confidenceThreshold);

  if (detection.class === "none" || detection.confidence < threshold) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-[6px] animate-pulse rounded-[18px] border-2 border-mission-critical shadow-mission-glow-red">
      <span className="absolute right-4 top-4 rounded-md border border-mission-critical bg-mission-critical px-3 py-1 text-mission-label font-bold uppercase tracking-[0.16em] text-mission-bg">
        Critical Alarm
      </span>
    </div>
  );
}
