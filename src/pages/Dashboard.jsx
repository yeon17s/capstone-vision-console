import AIStatusPanel from "../components/dashboard/AIStatusPanel";
import AlertFeed from "../components/dashboard/AlertFeed";
import CriticalAlarmOverlay from "../components/dashboard/CriticalAlarmOverlay";
import DriveController from "../components/dashboard/DriveController";
import EStopButton from "../components/dashboard/EStopButton";
import MiniMap from "../components/dashboard/MiniMap";
import PanTiltController from "../components/dashboard/PanTiltController";
import VideoStream from "../components/dashboard/VideoStream";
import AIOverlay from "../components/dashboard/AIOverlay";

function Dashboard() {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-6">
        <div className="relative">
          <VideoStream />
          <AIOverlay />
          <CriticalAlarmOverlay />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <DriveController />
          <PanTiltController />
          <MiniMap />
          <AlertFeed />
        </div>
      </section>
      <aside className="space-y-6">
        <AIStatusPanel />
        <EStopButton />
      </aside>
    </main>
  );
}

export default Dashboard;
