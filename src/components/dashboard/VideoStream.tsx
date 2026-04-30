import { useEffect } from "react";
import Typography from "../ui/Typography";
import useSettingsStore from "../../store/settingsStore";
import useRobotStore from "../../store/robotStore";

interface VideoStreamProps {
  imgRef: React.RefObject<HTMLImageElement | null>;
  inverted: boolean;
  onToggleInvert: () => void;
}

export default function VideoStream({ imgRef, inverted, onToggleInvert }: VideoStreamProps) {
  const jetsonIp = useSettingsStore((s) => s.jetsonIp);
  const streamUrl = `http://${jetsonIp}:8080/stream?topic=/cv_camera/image_raw`;
  const setConnectionStatus = useRobotStore((s) => s.setConnectionStatus);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        onToggleInvert();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onToggleInvert]);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-10 rounded-[20px] border border-[var(--color-accent-yellow)]" />

      <img
        ref={imgRef}
        src={streamUrl}
        alt="Camera feed"
        crossOrigin="anonymous"
        className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-150"
        style={inverted ? { filter: "invert(1) hue-rotate(180deg)" } : undefined}
        onLoad={() => setConnectionStatus("cameraConnected", true)}
        onError={() => setConnectionStatus("cameraConnected", false)}
      />

      <div className="absolute inset-x-4 top-4 z-10 flex items-start justify-between">
        <div className="rounded-md bg-mission-panel px-3 py-1.5 shadow-mission-soft">
          <Typography as="span" variant="panelTitle" className="tracking-[0.18em]">
            Camera Stream &amp; AI Output
          </Typography>
        </div>

        <div
          className={[
            "cursor-pointer rounded-lg border bg-mission-panel px-3 py-1.5 transition-colors",
            inverted
              ? "border-mission-info bg-mission-info/10"
              : "border-[var(--color-accent-yellow)]",
          ].join(" ")}
          onClick={onToggleInvert}
        >
          <Typography variant="overline" className="tracking-[0.14em]">
            {inverted ? "INVERTED (Spacebar)" : "RGB (Spacebar)"}
          </Typography>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/45 to-transparent" />
    </>
  );
}
