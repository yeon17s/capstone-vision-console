import Typography from "../ui/Typography";
import useRobotStore from "../../store/robotStore";

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

export default function AIOverlay() {
  const detection = useRobotStore((s) => s.detection);

  const isVisible = detection.class === "person";

  const leftPct = (detection.bbox.x / VIDEO_WIDTH) * 100;
  const topPct = (detection.bbox.y / VIDEO_HEIGHT) * 100;
  const widthPct = (detection.bbox.w / VIDEO_WIDTH) * 100;
  const heightPct = (detection.bbox.h / VIDEO_HEIGHT) * 100;

  return (
    <div className="pointer-events-none absolute inset-0 rounded-[20px]">
      {isVisible && (
        <div
          className="absolute rounded-sm border-2 border-mission-critical shadow-mission-glow-red"
          style={{
            left: `${leftPct}%`,
            top: `${topPct}%`,
            width: `${widthPct}%`,
            height: `${heightPct}%`,
          }}
        >
          <Typography
            as="span"
            variant="panelTitle"
            className="absolute -top-8 left-0 rounded-md bg-mission-critical px-2 py-1 tracking-[0.08em] text-white"
          >
            {detection.class} | {detection.confidence.toFixed(1)}%
          </Typography>
        </div>
      )}
    </div>
  );
}
