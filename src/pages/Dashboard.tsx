import AIOverlay from "../components/dashboard/AIOverlay";
import AIStatusPanel from "../components/dashboard/AIStatusPanel";
import AlertFeed from "../components/dashboard/AlertFeed";
// import CriticalAlarmOverlay from "../components/dashboard/CriticalAlarmOverlay";
import DriveController from "../components/dashboard/DriveController";
import VideoStream from "../components/dashboard/VideoStream";
import Typography from "../components/ui/Typography";

export default function Dashboard() {
  return (
    <main className="grid min-h-0 flex-1 grid-cols-[1.88fr_0.92fr] gap-0 overflow-hidden">
      {/* ══════════════════════════════
          LEFT — Camera + AI Status
      ══════════════════════════════ */}
      <section className="flex min-h-0 flex-col gap-3 border-r border-mission-border p-4">
        {/* Video container */}
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[20px] border border-mission-border bg-black shadow-mission-soft">
          <VideoStream />
          <AIOverlay />
          {/* <CriticalAlarmOverlay /> */} 
        </div>

        {/* AI Detection Status Strip */}
        <AIStatusPanel />
      </section>

      {/* ══════════════════════════════
          RIGHT — Control Panel
      ══════════════════════════════ */}
      <aside className="flex min-h-0 flex-col overflow-hidden bg-mission-bg">
        {/* Panel header */}
        <div className="border-b border-mission-border bg-mission-panel px-5 py-3">
          <Typography variant="panelTitle" className="tracking-[0.28em]">
            Control Panel
          </Typography>
        </div>

        {/* Scrollable controls */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <DriveController />
          <AlertFeed />
        </div>
      </aside>
    </main>
  );
}
