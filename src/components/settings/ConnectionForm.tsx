import { useState } from "react";
import useSettingsStore from "../../store/settingsStore";
import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";

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
    <MissionPanel title="System & Network Configuration" bodyClassName="p-4">
      <div className="space-y-3">
        <div>
          <Typography as="label" variant="overline" tone="subtle" className="mb-1 block font-bold tracking-[0.14em]">
            Robot IP
          </Typography>
          <input
            type="text"
            value={draft.jetsonIp}
            onChange={(e) => setDraft((d) => ({ ...d, jetsonIp: e.target.value }))}
            className="w-full rounded border border-mission-border bg-mission-bg px-3 py-1.5 font-mono text-mission-control text-mission-text focus:border-mission-info focus:outline-none"
          />
        </div>

        <div>
          <Typography as="label" variant="overline" tone="subtle" className="mb-1 block font-bold tracking-[0.14em]">
            Rosbridge Port
          </Typography>
          <input
            type="text"
            value={draft.rosbridgePort}
            onChange={(e) => setDraft((d) => ({ ...d, rosbridgePort: e.target.value }))}
            className="w-full rounded border border-mission-border bg-mission-bg px-3 py-1.5 font-mono text-mission-control text-mission-text focus:border-mission-info focus:outline-none"
          />
        </div>

        <div>
          <Typography as="label" variant="overline" tone="subtle" className="mb-1 block font-bold tracking-[0.14em]">
            Backend URL
          </Typography>
          <input
            type="text"
            value={draft.fastapiUrl}
            onChange={(e) => setDraft((d) => ({ ...d, fastapiUrl: e.target.value }))}
            className="w-full rounded border border-mission-border bg-mission-bg px-3 py-1.5 font-mono text-mission-control text-mission-text focus:border-mission-info focus:outline-none"
          />
        </div>

        <Button
          onClick={handleSave}
          variant="infoOutline"
          size="md"
          className={`mt-1 w-full ${saved ? "border-mission-active/50 bg-mission-active/10 text-mission-active hover:bg-mission-active/15" : ""}`}
        >
          <Typography as="span" variant="controlStrong" tone={saved ? "success" : "info"}>
            {saved ? "Saved" : "Save & Apply"}
          </Typography>
        </Button>
      </div>
    </MissionPanel>
  );
}
