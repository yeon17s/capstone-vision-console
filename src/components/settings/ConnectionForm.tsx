import { useState } from "react";
import useSettingsStore from "../../store/settingsStore";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";
import Field from "../ui/Field";
import TextInput from "../ui/TextInput";
import Typography from "../ui/Typography";

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
        <Field label="Robot IP">
          <TextInput
            value={draft.jetsonIp}
            onChange={(e) => setDraft((d) => ({ ...d, jetsonIp: e.target.value }))}
          />
        </Field>

        <Field label="Rosbridge Port">
          <TextInput
            value={draft.rosbridgePort}
            onChange={(e) => setDraft((d) => ({ ...d, rosbridgePort: e.target.value }))}
          />
        </Field>

        <Field label="Backend URL">
          <TextInput
            value={draft.fastapiUrl}
            onChange={(e) => setDraft((d) => ({ ...d, fastapiUrl: e.target.value }))}
          />
        </Field>

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
