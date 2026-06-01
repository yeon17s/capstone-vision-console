import { useState, useRef } from "react";
import AIOverlay from "../components/dashboard/AIOverlay";
import AIStatusPanel from "../components/dashboard/AIStatusPanel";
import AlertFeed from "../components/dashboard/AlertFeed";
import DriveController from "../components/dashboard/DriveController";
import VideoStream from "../components/dashboard/VideoStream";
import Button from "../components/ui/Button";
import Typography from "../components/ui/Typography";
import useRobotStore from "../store/robotStore";

export default function Dashboard() {
  const [inverted, setInverted] = useState(false);
  const [frozenUrl, setFrozenUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const recentLog = useRobotStore((s) => s.recentLog);
  const historyLog = useRobotStore((s) => s.historyLog);

  const todayStr = new Date().toISOString().slice(0, 10);
  const totalCount = historyLog.length;
  const todayCount = historyLog.filter((e) => e.timestamp.startsWith(todayStr)).length;
  const avgFps = recentLog.length > 0
    ? recentLog.reduce((s, e) => s + e.fps, 0) / recentLog.length
    : null;
  const avgConf = recentLog.length > 0
    ? recentLog.reduce((s, e) => s + e.confidence, 0) / recentLog.length
    : null;

  const handleFreeze = () => {
    const latestUrl = recentLog.find((e) => e.snapshot_url)?.snapshot_url;
    if (latestUrl) {
      setFrozenUrl(latestUrl);
    } else {
      // snapshot_url이 없을 때 "__none__" 센티널로 "스냅샷 없음" UI를 표시
      setFrozenUrl("__none__");
    }
  };

  return (
    <main className="grid min-h-0 flex-1 grid-cols-[1.88fr_0.92fr] gap-0 overflow-hidden">
      {/* ══════════════════════════════
          LEFT — Camera + AI Status
      ══════════════════════════════ */}
      <section className="flex min-h-0 flex-col gap-3 border-r border-mission-border p-4">
        {/* Video container */}
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[20px] border border-mission-border bg-black shadow-mission-soft">
          <VideoStream
            imgRef={imgRef}
            inverted={inverted}
            onToggleInvert={() => setInverted((v) => !v)}
          />
          <AIOverlay />

          {/* Freeze Frame Overlay */}
          {frozenUrl && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[20px] bg-black/80 backdrop-blur-sm">
              {frozenUrl === "__none__" ? (
                <Typography variant="control" tone="warning" className="max-w-xs text-center">
                  저장된 스냅샷이 없습니다. 탐지 후 다시 시도하세요.
                </Typography>
              ) : (
                <img
                  src={frozenUrl}
                  alt="Frozen snapshot"
                  className="max-h-[80%] max-w-[90%] rounded border border-mission-border object-contain shadow-mission-soft"
                />
              )}
              <Button variant="panel" size="sm" onClick={() => setFrozenUrl(null)}>
                <Typography as="span" variant="controlStrong" className="tracking-[0.12em]">CLOSE</Typography>
              </Button>
            </div>
          )}
        </div>

        {/* KPI Stats Bar */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "TOTAL DETECTIONS", value: totalCount > 0 ? String(totalCount) : "—" },
            { label: "TODAY", value: todayCount > 0 ? String(todayCount) : "—" },
            { label: "AVG FPS", value: avgFps !== null ? avgFps.toFixed(1) : "—" },
            { label: "AVG CONF", value: avgConf !== null ? avgConf.toFixed(1) + "%" : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center gap-0.5 rounded-[10px] border border-mission-border bg-mission-panel px-3 py-2">
              <Typography as="span" variant="overline" tone="subtle" className="tracking-[0.12em]">{label}</Typography>
              <Typography as="span" variant="monoStrong" className="text-mission-info">{value}</Typography>
            </div>
          ))}
        </div>

        {/* AI Detection Status Strip */}
        <AIStatusPanel inverted={inverted} onFreeze={handleFreeze} />
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