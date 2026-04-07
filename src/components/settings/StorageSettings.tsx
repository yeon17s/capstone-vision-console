import useSettingsStore from "../../store/settingsStore";
import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";

const POLICIES = [
  { value: "original",          label: "Original Only" },
  { value: "original+inverted", label: "Original + Inverted" },
] as const;

export default function StorageSettings() {
  const { storagePolicy, updateSettings } = useSettingsStore();

  return (
    <MissionPanel title="Data & Storage Handling" bodyClassName="p-4">
      {/* Storage Policy */}
      <div className="mb-4">
        <Typography variant="overline" className="mb-2 font-bold text-mission-text/90">Storage Policy</Typography>
        <div className="flex flex-col gap-1.5">
          {POLICIES.map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 text-mission-control font-medium text-mission-text"
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
        <Typography variant="overline" className="mb-1 font-bold text-mission-text/90">Local Storage Path</Typography>
        <div className="rounded border border-mission-border bg-mission-bg px-3 py-2">
          <Typography variant="monoStrong" className="text-mission-text/55">/data/robot_logs/</Typography>
        </div>
      </div>

      {/* Cleanup Actions */}
      <div>
        <Typography variant="overline" className="mb-2 font-bold text-mission-text/90">Local Cleanup</Typography>
        <div className="flex flex-col gap-2">
          <Button variant="warningOutline" size="md" className="w-full">
            <Typography as="span" variant="controlStrong" tone="warning" className="normal-case tracking-normal">Clear Local Cache (720 MB)</Typography>
          </Button>
          <Button variant="dangerOutline" size="md" className="w-full">
            <Typography as="span" variant="controlStrong" tone="danger" className="normal-case tracking-normal">Delete Old Logs (&gt; 30 Days)</Typography>
          </Button>
        </div>
      </div>
    </MissionPanel>
  );
}
