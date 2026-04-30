import { useRef, useState, useEffect } from "react";
import Typography from "../ui/Typography";
import useRobotStore from "../../store/robotStore";

const SRC_W = 640;
const SRC_H = 480;
const SRC_RATIO = SRC_W / SRC_H;

interface RenderedRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function getRenderedRect(containerW: number, containerH: number): RenderedRect {
  const containerRatio = containerW / containerH;
  if (containerRatio > SRC_RATIO) {
    // pillarbox: image fills height, cropped horizontally
    const renderedW = containerH * SRC_RATIO;
    return { left: (containerW - renderedW) / 2, top: 0, width: renderedW, height: containerH };
  } else {
    // letterbox: image fills width, cropped vertically
    const renderedH = containerW / SRC_RATIO;
    return { left: 0, top: (containerH - renderedH) / 2, width: containerW, height: renderedH };
  }
}

export default function AIOverlay() {
  const detection = useRobotStore((s) => s.detection);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isVisible = detection.class === "person";
  const { left: imgLeft, top: imgTop, width: imgW, height: imgH } =
    getRenderedRect(containerSize.w, containerSize.h);

  const scaleX = imgW / SRC_W;
  const scaleY = imgH / SRC_H;

  const boxLeft = imgLeft + detection.bbox.x * scaleX;
  const boxTop = imgTop + detection.bbox.y * scaleY;
  const boxW = detection.bbox.w * scaleX;
  const boxH = detection.bbox.h * scaleY;

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 rounded-[20px]">
      {isVisible && containerSize.w > 0 && (
        <div
          className="absolute rounded-sm border-2 border-mission-critical shadow-mission-glow-red"
          style={{ left: boxLeft, top: boxTop, width: boxW, height: boxH }}
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
