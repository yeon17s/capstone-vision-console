import { useEffect } from "react";
import useSettingsStore from "../../store/settingsStore";
import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";
import RangeField from "../ui/RangeField";
import { cancelAutoScan } from "../../lib/autoScanController";
import { syncConfidenceThreshold } from "../../lib/historyApi";

export default function AIConfig() {
  const { confidenceThreshold, audioAlarmEnabled, volume, autoScanEnabled, updateSettings, fastapiUrl } =
    useSettingsStore();

  // 슬라이더 조작 500ms 후 백엔드에 threshold 동기화 (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      void syncConfidenceThreshold(fastapiUrl, confidenceThreshold);
    }, 500);
    return () => clearTimeout(timer);
  }, [confidenceThreshold, fastapiUrl]);

  return (
    <MissionPanel title="AI & Sensor Configuration" bodyClassName="p-4">
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

      {/* Auto Scan */}
      <div className="mb-4">
        <Typography variant="overline" className="mb-1 font-bold text-mission-text/90">Auto Scan on Detection</Typography>
        <Typography as="p" variant="overline" tone="subtle" className="mb-2 text-mission-text/40">
          탐지 시 로봇이 자동으로 좌우 스캔 (약 8초, 15초 쿨다운)
        </Typography>
        <div className="flex w-fit overflow-hidden rounded border border-mission-border">
          <Button
            onClick={() => updateSettings({ autoScanEnabled: true })}
            variant="segment"
            size="md"
            active={autoScanEnabled}
            className="rounded-none border-0 border-r border-mission-border px-5 py-1.5"
          >
            <Typography as="span" variant="controlStrong" tone={autoScanEnabled ? "success" : "muted"}>On</Typography>
          </Button>
          <Button
            onClick={() => { updateSettings({ autoScanEnabled: false }); cancelAutoScan(); }}
            variant="segment"
            size="md"
            active={!autoScanEnabled}
            className={`rounded-none border-0 px-5 py-1.5 ${!autoScanEnabled ? "bg-mission-critical/10 text-mission-critical hover:bg-mission-critical/15 hover:text-mission-critical" : ""}`}
          >
            <Typography as="span" variant="controlStrong" tone={!autoScanEnabled ? "danger" : "muted"}>Off</Typography>
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
