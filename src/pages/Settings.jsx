import ConnectionForm from "../components/settings/ConnectionForm";
import DiagnosticsMonitor from "../components/settings/DiagnosticsMonitor";

function Settings() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
      <ConnectionForm />
      <DiagnosticsMonitor />
    </main>
  );
}

export default Settings;
