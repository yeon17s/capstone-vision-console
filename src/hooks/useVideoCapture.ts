import { useRef, useCallback } from "react";

export function useVideoCapture() {
  const imgRef = useRef<HTMLImageElement | null>(null);

  const capture = useCallback((inverted: boolean): string | undefined => {
    const img = imgRef.current;
    if (!img || img.naturalWidth === 0) return undefined;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return undefined;
      if (inverted) {
        ctx.filter = "invert(1) hue-rotate(180deg)";
      }
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL("image/png");
    } catch {
      // CORS SecurityError: stream server does not send CORS headers
      return undefined;
    }
  }, []);

  return { imgRef, capture };
}
