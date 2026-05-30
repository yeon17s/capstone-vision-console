import { useState } from "react";
import useSettingsStore from "../../store/settingsStore";
import useRobotStore from "../../store/robotStore";
import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";
import { deleteAllHistory } from "../../lib/historyApi";
import { clearPendingQueue } from "../../lib/pendingQueueController";

const SETTINGS_KEY = "sentinel-ui-settings";
const FP_KEY = "sentinel-fp-overrides";

export default function StorageSettings() {
  const fastapiUrl = useSettingsStore((s) => s.fastapiUrl);
  const hydrateSettings = useSettingsStore((s) => s.hydrateSettings);
  const clearDetectionLog = useRobotStore((s) => s.clearDetectionLog);

  const [cacheCleared, setCacheCleared] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  function handleClearCache() {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(FP_KEY);
    hydrateSettings();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  }

  async function handleDeleteAll() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeleteStatus("loading");
    setDeleteConfirm(false);
    try {
      await deleteAllHistory(fastapiUrl);
      clearDetectionLog();
      clearPendingQueue();
      setDeleteStatus("done");
    } catch {
      setDeleteStatus("error");
    } finally {
      setTimeout(() => setDeleteStatus("idle"), 2500);
    }
  }

  function handleDeleteCancel() {
    setDeleteConfirm(false);
  }

  return (
    <MissionPanel title="Data & Storage Handling" bodyClassName="p-4">
      {/* Storage Path */}
      <div className="mb-4">
        <Typography variant="overline" className="mb-1 font-bold text-mission-text/90">Storage Path (Jetson)</Typography>
        <div className="rounded border border-mission-border bg-mission-bg px-3 py-2">
          <Typography variant="monoStrong" className="text-mission-text/55">snapshots/</Typography>
        </div>
      </div>

      {/* Cleanup Actions */}
      <div>
        <Typography variant="overline" className="mb-2 font-bold text-mission-text/90">Cleanup Actions</Typography>
        <div className="flex flex-col gap-2">
          {/* Clear Local Cache */}
          <Button variant="panel" size="md" className="w-full" onClick={handleClearCache}>
            <Typography as="span" variant="controlStrong" className="normal-case tracking-normal">
              {cacheCleared ? "Cleared" : "Clear Local Cache"}
            </Typography>
          </Button>

          {/* Delete All Data (Jetson) */}
          {deleteConfirm ? (
            <div className="flex gap-2">
              <Button variant="panel" size="md" className="flex-1 border-mission-secondary/60 text-mission-secondary" onClick={handleDeleteAll}>
                <Typography as="span" variant="controlStrong" className="normal-case tracking-normal">Confirm Delete</Typography>
              </Button>
              <Button variant="panel" size="md" className="flex-1" onClick={handleDeleteCancel}>
                <Typography as="span" variant="controlStrong" tone="muted" className="normal-case tracking-normal">Cancel</Typography>
              </Button>
            </div>
          ) : (
            <Button
              variant="panel"
              size="md"
              className="w-full"
              onClick={handleDeleteAll}
              disabled={deleteStatus === "loading"}
            >
              <Typography
                as="span"
                variant="controlStrong"
                tone={deleteStatus === "error" ? "danger" : deleteStatus === "done" ? "success" : "muted"}
                className="normal-case tracking-normal"
              >
                {deleteStatus === "loading" ? "Deleting…"
                  : deleteStatus === "done" ? "Deleted"
                  : deleteStatus === "error" ? "Delete Failed"
                  : "Delete All Data (Jetson)"}
              </Typography>
            </Button>
          )}
        </div>
      </div>
    </MissionPanel>
  );
}
