import type { BBox, Detection } from "../store/robotStore";

const TARGET_CLASS_ALIASES: Record<string, string> = {
  person: "person",
  cod: "cod",
  camouflage: "camouflage",
  camouflaged_object: "camouflage",
  "camouflaged-object": "camouflage",
  "camouflaged object": "camouflage",
};

export const NO_DETECTION_CLASS = "none";

interface RawDetectionLike {
  class?: unknown;
  confidence?: unknown;
  bbox?: unknown;
  fps?: unknown;
  frame_delay_ms?: unknown;
}

function emptyBBox(): BBox {
  return { x: 0, y: 0, w: 0, h: 0 };
}

function finiteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeDetectionClass(value: unknown): string {
  if (typeof value !== "string") return NO_DETECTION_CLASS;
  const normalized = value.trim().toLowerCase();
  return TARGET_CLASS_ALIASES[normalized] ?? NO_DETECTION_CLASS;
}

export function isTargetDetectionClass(value: unknown): boolean {
  return normalizeDetectionClass(value) !== NO_DETECTION_CLASS;
}

export function hasRenderableBBox(bbox: BBox | null | undefined): bbox is BBox {
  return Boolean(
    bbox &&
    Number.isFinite(bbox.x) &&
    Number.isFinite(bbox.y) &&
    Number.isFinite(bbox.w) &&
    Number.isFinite(bbox.h) &&
    bbox.w > 0 &&
    bbox.h > 0
  );
}

export function hasRenderableDetection(detection: Pick<Detection, "class" | "bbox">): boolean {
  return isTargetDetectionClass(detection.class) && hasRenderableBBox(detection.bbox);
}

function normalizeBBox(raw: unknown, sourceW: number, sourceH: number): BBox | null {
  if (!raw || typeof raw !== "object") return null;
  const bbox = raw as Partial<Record<keyof BBox, unknown>>;
  const x = finiteNumber(bbox.x, NaN);
  const y = finiteNumber(bbox.y, NaN);
  const w = finiteNumber(bbox.w, NaN);
  const h = finiteNumber(bbox.h, NaN);

  if (![x, y, w, h, sourceW, sourceH].every(Number.isFinite)) return null;
  if (w <= 0 || h <= 0 || sourceW <= 0 || sourceH <= 0) return null;

  const left = clamp(x, 0, sourceW);
  const top = clamp(y, 0, sourceH);
  const right = clamp(x + w, 0, sourceW);
  const bottom = clamp(y + h, 0, sourceH);

  if (right <= left || bottom <= top) return null;
  return { x: left, y: top, w: right - left, h: bottom - top };
}

export function normalizeDetectionPayload(
  raw: RawDetectionLike,
  confidenceThreshold: number,
  sourceW: number,
  sourceH: number
): Detection {
  const cls = normalizeDetectionClass(raw.class);
  const confidence = clamp(finiteNumber(raw.confidence), 0, 100);
  const threshold = clamp(finiteNumber(confidenceThreshold), 0, 100);
  const bbox = normalizeBBox(raw.bbox, sourceW, sourceH);
  const fps = Math.max(0, finiteNumber(raw.fps));
  const frameDelayMs = Math.max(0, Math.round(finiteNumber(raw.frame_delay_ms)));

  if (cls === NO_DETECTION_CLASS || confidence < threshold || !bbox) {
    return {
      class: NO_DETECTION_CLASS,
      confidence: 0,
      bbox: emptyBBox(),
      fps,
      frameDelayMs,
    };
  }

  return {
    class: cls,
    confidence,
    bbox,
    fps,
    frameDelayMs,
  };
}
