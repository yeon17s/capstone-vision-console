import { useRef, useState, useEffect } from "react";
import Typography from "../ui/Typography";
import useRobotStore from "../../store/robotStore";
import useSettingsStore, {
  DEFAULT_FRAME_HEIGHT,
  DEFAULT_FRAME_WIDTH,
  isValidFrameDimension,
} from "../../store/settingsStore";

interface RenderedRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// object-cover: 비율 유지하며 컨테이너를 꽉 채움 → 이미지가 crop됨
// 렌더된 이미지 크기는 컨테이너보다 크고, 오프셋은 음수(중앙 정렬로 crop)
function getRenderedRect(containerW: number, containerH: number, srcRatio: number): RenderedRect {
  const containerRatio = containerW / containerH;
  if (containerRatio > srcRatio) {
    // 컨테이너가 더 넓음 → 가로로 꽉 채우고 세로가 crop됨
    const renderedH = containerW / srcRatio;
    return { left: 0, top: (containerH - renderedH) / 2, width: containerW, height: renderedH };
  } else {
    // 컨테이너가 더 좁음 → 세로로 꽉 채우고 가로가 crop됨
    const renderedW = containerH * srcRatio;
    return { left: (containerW - renderedW) / 2, top: 0, width: renderedW, height: containerH };
  }
}

export default function AIOverlay() {
  const detection = useRobotStore((s) => s.detection);
  const frameWidth  = useSettingsStore((s) => s.frameWidth);
  const frameHeight = useSettingsStore((s) => s.frameHeight);
  const sourceW = isValidFrameDimension(frameWidth) ? frameWidth : DEFAULT_FRAME_WIDTH;
  const sourceH = isValidFrameDimension(frameHeight) ? frameHeight : DEFAULT_FRAME_HEIGHT;
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
  const srcRatio = sourceW / sourceH;
  const { left: imgLeft, top: imgTop, width: imgW, height: imgH } =
    getRenderedRect(containerSize.w, containerSize.h, srcRatio);

  const scaleX = imgW / sourceW;
  const scaleY = imgH / sourceH;

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
            Detected | {detection.confidence.toFixed(1)}%
          </Typography>
        </div>
      )}
    </div>
  );
}
