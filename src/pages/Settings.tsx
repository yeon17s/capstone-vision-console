import ConnectionForm from "../components/settings/ConnectionForm";
import DiagnosticsMonitor from "../components/settings/DiagnosticsMonitor";
import AIConfig from "../components/settings/AIConfig";
import StorageSettings from "../components/settings/StorageSettings";

export default function Settings() {
  return (
    <main className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto p-3">
      <div className="flex flex-col gap-3">
        <ConnectionForm />
        <AIConfig />
      </div>
      <div className="flex flex-col gap-3">
        <DiagnosticsMonitor />
        <StorageSettings />
      </div>
    </main>
  );
}
