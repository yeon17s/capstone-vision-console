import useSettingsStore from "../../store/settingsStore";
import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";

export default function AIConfig() {
  const { confidenceThreshold, audioAlarmEnabled, volume, updateSettings } =
    useSettingsStore();

  const thresholdPct = Math.round(confidenceThreshold * 100);

  return (
    <MissionPanel title="AI & Sensor Configuration" bodyClassName="p-4">
      {/* Confidence Threshold */}
      <div className="mb-5">
        <div className="mb-1 flex items-center justify-between">
          <Typography as="label" variant="overline" className="font-bold text-mission-text/90">
            Confidence Threshold
          </Typography>
          <Typography as="span" variant="monoStrong" tone="info">
            {thresholdPct}%
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Typography as="span" variant="overline" className="text-mission-text/30">0</Typography>
          <input
            type="range"
            min={0}
            max={100}
            value={thresholdPct}
            onChange={(e) =>
              updateSettings({ confidenceThreshold: Number(e.target.value) / 100 })
            }
            className="h-1.5 flex-1 cursor-pointer accent-[var(--color-accent-blue)]"
          />
          <Typography as="span" variant="overline" className="text-mission-text/30">100</Typography>
        </div>
        <Typography variant="overline" tone="subtle" className="mt-1 tracking-[0.08em] text-mission-text/40">
          Current threshold: {thresholdPct}%
        </Typography>
      </div>

      {/* Audio Alarm */}
      <div className="mb-4">
        <Typography variant="overline" className="mb-2 font-bold text-mission-text/90">Audio Alarm</Typography>
        <div className="flex w-fit overflow-hidden rounded border border-mission-border">
          <Button
            onClick={() => updateSettings({ audioAlarmEnabled: true })}
            variant="segment"
            size="md"
            active={audioAlarmEnabled}
            className="rounded-none border-0 border-r border-mission-border px-5 py-1.5"
          >
            <Typography as="span" variant="controlStrong" tone={audioAlarmEnabled ? "success" : "muted"}>On</Typography>
          </Button>
          <Button
            onClick={() => updateSettings({ audioAlarmEnabled: false })}
            variant="segment"
            size="md"
            active={!audioAlarmEnabled}
            className={`rounded-none border-0 px-5 py-1.5 ${!audioAlarmEnabled ? "bg-mission-critical/10 text-mission-critical hover:bg-mission-critical/15 hover:text-mission-critical" : ""}`}
          >
            <Typography as="span" variant="controlStrong" tone={!audioAlarmEnabled ? "danger" : "muted"}>Off</Typography>
          </Button>
        </div>
      </div>

      {/* Volume */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <Typography variant="overline" className="font-bold text-mission-text/90">Volume</Typography>
          <Typography
            as="span"
            variant="monoStrong"
            className={audioAlarmEnabled ? "text-mission-text/60" : "text-mission-text/20"}
          >
            {volume}%
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Typography as="span" variant="overline" className="text-mission-text/30">0</Typography>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            disabled={!audioAlarmEnabled}
            onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
            className="h-1.5 flex-1 cursor-pointer accent-[var(--color-accent-blue)] disabled:cursor-not-allowed disabled:opacity-30"
          />
          <Typography as="span" variant="overline" className="text-mission-text/30">100</Typography>
        </div>
      </div>
    </MissionPanel>
  );
}
