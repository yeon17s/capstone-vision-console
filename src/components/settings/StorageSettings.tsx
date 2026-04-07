import useSettingsStore from "../../store/settingsStore";

const POLICIES = [
  { value: "original",          label: "Original Only" },
  { value: "original+inverted", label: "Original + Inverted" },
] as const;

export default function StorageSettings() {
  const { storagePolicy, updateSettings } = useSettingsStore();

  return (
    <section className="rounded border border-mission-border bg-mission-panel p-4">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-mission-text/50">
        Data &amp; Storage Handling
      </p>

      {/* Storage Policy */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold text-mission-text">Storage Policy</p>
        <div className="flex flex-col gap-1.5">
          {POLICIES.map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 text-xs text-mission-text"
            >
              <input
                type="radio"
                name="storage"
                checked={storagePolicy === value}
                onChange={() => updateSettings({ storagePolicy: value })}
                className="accent-[var(--color-accent-blue)]"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Local Storage Path */}
      <div className="mb-4">
        <p className="mb-1 text-xs font-semibold text-mission-text">Local Storage Path</p>
        <div className="rounded border border-mission-border bg-mission-bg px-3 py-2 font-mono text-[11px] text-mission-text/40">
          /data/robot_logs/
        </div>
      </div>

      {/* Cleanup Actions */}
      <div>
        <p className="mb-2 text-xs font-semibold text-mission-text">Local Cleanup</p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="w-full rounded border border-mission-suspicious/30 bg-mission-suspicious/10 py-2 text-xs font-semibold text-mission-suspicious transition hover:bg-mission-suspicious/20"
          >
            Clear Local Cache (720 MB)
          </button>
          <button
            type="button"
            className="w-full rounded border border-mission-critical/30 bg-mission-critical/10 py-2 text-xs font-semibold text-mission-critical transition hover:bg-mission-critical/20"
          >
            Delete Old Logs (&gt; 30 Days)
          </button>
        </div>
      </div>
    </section>
  );
}
