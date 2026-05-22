import { useState, useEffect, useCallback } from "react";
import AIOverlay from "../components/dashboard/AIOverlay";
import AIStatusPanel from "../components/dashboard/AIStatusPanel";
import AlertFeed from "../components/dashboard/AlertFeed";
import CriticalAlarmOverlay from "../components/dashboard/CriticalAlarmOverlay";
import DriveController from "../components/dashboard/DriveController";
import VideoStream from "../components/dashboard/VideoStream";
import Button from "../components/ui/Button";
import Typography from "../components/ui/Typography";
import { useVideoCapture } from "../hooks/useVideoCapture";
import type { CaptureResult } from "../hooks/useVideoCapture";
import type { SnapshotStatus } from "../store/robotStore";

interface DashboardProps {
  onCaptureReady?: (capture: (inverted: boolean) => CaptureResult) => void;
}

type FreezeState =
  | { kind: "ok"; dataUrl: string }
  | { kind: "error"; message: string };

const FREEZE_ERROR_LABEL: Record<Exclude<SnapshotStatus, "ok" | "skipped">, string> = {
  cors_error:   "Capture unavailable (CORS — stream server does not send CORS headers)",
  canvas_error: "Capture unavailable (canvas error)",
  unavailable:  "Capture unavailable (no active frame)",
};

export default function Dashboard({ onCaptureReady }: DashboardProps) {
  const [inverted, setInverted] = useState(false);
  const [frozen, setFrozen] = useState<FreezeState | null>(null);
  const { imgRef, capture } = useVideoCapture();

  useEffect(() => {
    return onCaptureReady?.(capture);
  // capture identity is stable (useCallback with no deps)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCaptureReady]);

  const handleFreeze = useCallback(() => {
    const result = capture(inverted);
    if (result.status === "ok" && result.dataUrl) {
      setFrozen({ kind: "ok", dataUrl: result.dataUrl });
    } else {
      setFrozen({
        kind: "error",
        message: FREEZE_ERROR_LABEL[result.status as Exclude<SnapshotStatus, "ok" | "skipped">] ?? "Capture unavailable",
      });
    }
  }, [capture, inverted]);

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
            onToggleInvert={frozen ? undefined : () => setInverted((v) => !v)}
          />
          <AIOverlay />
          <CriticalAlarmOverlay />

          {/* Freeze Frame overlay */}
          {frozen && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[20px] bg-black/80 backdrop-blur-sm">
              {frozen.kind === "ok" ? (
                <img
                  src={frozen.dataUrl}
                  alt="Frozen frame"
                  className="max-h-[80%] max-w-[90%] rounded border border-mission-border object-contain shadow-mission-soft"
                />
              ) : (
                <Typography variant="control" tone="warning" className="max-w-xs text-center">
                  {frozen.message}
                </Typography>
              )}
              <Button variant="panel" size="sm" onClick={() => setFrozen(null)}>
                <Typography as="span" variant="controlStrong" className="tracking-[0.12em]">CLOSE</Typography>
              </Button>
            </div>
          )}
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
