import { useRef, useCallback } from "react";
import type { SnapshotStatus } from "../store/robotStore";

export interface CaptureResult {
  dataUrl: string | undefined;
  status: SnapshotStatus;
}

export function useVideoCapture() {
  const imgRef = useRef<HTMLImageElement | null>(null);

  const capture = useCallback((inverted: boolean): CaptureResult => {
    const img = imgRef.current;
    // 이미지가 아직 로드되지 않았거나 src가 없으면 캡처 불가
    if (!img || img.naturalWidth === 0) {
      return { dataUrl: undefined, status: "unavailable" };
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return { dataUrl: undefined, status: "canvas_error" };
      }
      // CSS filter가 아닌 canvas filter API로 인버트 적용 후 그려야 캡처에 반영됨
      if (inverted) {
        ctx.filter = "invert(1) hue-rotate(180deg)";
      }
      ctx.drawImage(img, 0, 0);
      return { dataUrl: canvas.toDataURL("image/png"), status: "ok" };
    } catch (e) {
      // crossOrigin 정책 위반 시 canvas.toDataURL()에서 SecurityError(code 18) 발생
      const isCors =
        e instanceof DOMException &&
        (e.name === "SecurityError" || e.code === 18);
      return { dataUrl: undefined, status: isCors ? "cors_error" : "canvas_error" };
    }
  }, []);

  return { imgRef, capture };
}
