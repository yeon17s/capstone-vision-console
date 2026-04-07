import useSettingsStore from "../../store/settingsStore";

export default function AIConfig() {
  const { confidenceThreshold, audioAlarmEnabled, volume, updateSettings } =
    useSettingsStore();

  const thresholdPct = Math.round(confidenceThreshold * 100);

  return (
    <section className="rounded border border-mission-border bg-mission-panel p-4">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-mission-text/50">
        AI &amp; Sensor Configuration
      </p>

      {/* Confidence Threshold */}
      <div className="mb-5">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-semibold text-mission-text">
            Confidence Threshold
          </label>
          <span className="font-mono text-xs font-semibold text-mission-info">
            {thresholdPct}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-mission-text/30">0</span>
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
          <span className="text-[10px] text-mission-text/30">100</span>
        </div>
        <p className="mt-1 text-[10px] text-mission-text/40">
          Current threshold: {thresholdPct}%
        </p>
      </div>

      {/* Audio Alarm */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold text-mission-text">Audio Alarm</p>
        <div className="flex w-fit overflow-hidden rounded border border-mission-border">
          <button
            type="button"
            onClick={() => updateSettings({ audioAlarmEnabled: true })}
            className={`border-r border-mission-border px-5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
              audioAlarmEnabled
                ? "bg-mission-active/15 text-mission-active"
                : "text-mission-text/30 hover:text-mission-text/60"
            }`}
          >
            On
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ audioAlarmEnabled: false })}
            className={`px-5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
              !audioAlarmEnabled
                ? "bg-mission-critical/10 text-mission-critical"
                : "text-mission-text/30 hover:text-mission-text/60"
            }`}
          >
            Off
          </button>
        </div>
      </div>

      {/* Volume */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-semibold text-mission-text">Volume</p>
          <span
            className={`font-mono text-xs ${audioAlarmEnabled ? "text-mission-text/60" : "text-mission-text/20"}`}
          >
            {volume}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-mission-text/30">0</span>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            disabled={!audioAlarmEnabled}
            onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
            className="h-1.5 flex-1 cursor-pointer accent-[var(--color-accent-blue)] disabled:cursor-not-allowed disabled:opacity-30"
          />
          <span className="text-[10px] text-mission-text/30">100</span>
        </div>
      </div>
    </section>
  );
}
