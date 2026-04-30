import useSettingsStore from "../../store/settingsStore";
import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";
import RangeField from "../ui/RangeField";

export default function AIConfig() {
  const { confidenceThreshold, audioAlarmEnabled, volume, updateSettings } =
    useSettingsStore();

  return (
    <MissionPanel title="AI & Sensor Configuration" bodyClassName="p-4" borderTone="mvp">
      {/* Confidence Threshold */}
      <RangeField
        className="mb-5"
        label="Confidence Threshold"
        value={confidenceThreshold}
        valueLabel={`${confidenceThreshold}%`}
        min={0}
        max={100}
        onChange={(e) =>
          updateSettings({ confidenceThreshold: Number(e.target.value) })
        }
        description={`Current threshold: ${confidenceThreshold}%`}
      />

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
      <RangeField
        label="Volume"
        value={volume}
        valueLabel={
          <Typography
            as="span"
            variant="monoStrong"
            className={audioAlarmEnabled ? "text-mission-text/60" : "text-mission-text/20"}
          >
            {volume}%
          </Typography>
        }
        min={0}
        max={100}
        disabled={!audioAlarmEnabled}
        onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
      />
    </MissionPanel>
  );
}
