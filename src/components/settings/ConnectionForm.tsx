import { useState } from "react";
import useSettingsStore from "../../store/settingsStore";

export default function ConnectionForm() {
  const { jetsonIp, rosbridgePort, fastapiUrl, updateSettings } = useSettingsStore();

  const [draft, setDraft] = useState({
    jetsonIp,
    rosbridgePort: String(rosbridgePort),
    fastapiUrl,
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const port = parseInt(draft.rosbridgePort, 10);
    updateSettings({
      jetsonIp: draft.jetsonIp,
      rosbridgePort: isNaN(port) ? rosbridgePort : port,
      fastapiUrl: draft.fastapiUrl,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="rounded border border-mission-border bg-mission-panel p-4">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-mission-text/50">
        System &amp; Network Configuration
      </p>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-mission-text/40">
            Robot IP
          </label>
          <input
            type="text"
            value={draft.jetsonIp}
            onChange={(e) => setDraft((d) => ({ ...d, jetsonIp: e.target.value }))}
            className="w-full rounded border border-mission-border bg-mission-bg px-3 py-1.5 font-mono text-xs text-mission-text focus:border-mission-info focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-mission-text/40">
            Rosbridge Port
          </label>
          <input
            type="text"
            value={draft.rosbridgePort}
            onChange={(e) => setDraft((d) => ({ ...d, rosbridgePort: e.target.value }))}
            className="w-full rounded border border-mission-border bg-mission-bg px-3 py-1.5 font-mono text-xs text-mission-text focus:border-mission-info focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-mission-text/40">
            Backend URL
          </label>
          <input
            type="text"
            value={draft.fastapiUrl}
            onChange={(e) => setDraft((d) => ({ ...d, fastapiUrl: e.target.value }))}
            className="w-full rounded border border-mission-border bg-mission-bg px-3 py-1.5 font-mono text-xs text-mission-text focus:border-mission-info focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          className={`mt-1 w-full rounded border py-2 text-xs font-bold uppercase tracking-wider transition ${
            saved
              ? "border-mission-active/50 bg-mission-active/10 text-mission-active"
              : "border-mission-info/40 bg-mission-info/10 text-mission-info hover:bg-mission-info/20"
          }`}
        >
          {saved ? "Saved" : "Save & Apply"}
        </button>
      </div>
    </section>
  );
}
