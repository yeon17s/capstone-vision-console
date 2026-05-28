import type { DetectionLogEntry } from "../store/robotStore";

export interface HistoryRow {
  timestamp: string;
  confidence: number;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
  fps: number;
  frame_delay_ms: number;
  pose_x?: number | null;
  pose_y?: number | null;
  pose_yaw?: number | null;
  snapshot_url?: string;
}

// DB에서 온 값이 null/undefined/빈문자열일 경우 fallback으로 대체
function safeNum(v: number | string | null | undefined, fallback: number): number {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// DB 행(snake_case) → 프론트엔드 상태(camelCase) 변환
function fromRow(row: HistoryRow): DetectionLogEntry {
  const poseX = safeNum(row.pose_x, NaN);
  const poseY = safeNum(row.pose_y, NaN);
  const poseYaw = safeNum(row.pose_yaw, NaN);
  // 세 값 모두 유한한 수여야 유효한 pose로 판단
  const hasPose = Number.isFinite(poseX) && Number.isFinite(poseY) && Number.isFinite(poseYaw);

  return {
    timestamp: row.timestamp,
    class: "person",
    confidence: safeNum(row.confidence, 0),
    bbox: {
      x: safeNum(row.bbox_x, 0),
      y: safeNum(row.bbox_y, 0),
      w: safeNum(row.bbox_w, 0),
      h: safeNum(row.bbox_h, 0),
    },
    fps: safeNum(row.fps, 0),
    frameDelayMs: safeNum(row.frame_delay_ms, 0),
    pose: hasPose ? { x: poseX, y: poseY, yaw: poseYaw } : undefined,
    snapshot_url: row.snapshot_url,
  };
}

export async function appendHistoryLog(
  baseUrl: string,
  entry: DetectionLogEntry
): Promise<void> {
  const payload = {
    timestamp: entry.timestamp,
    confidence: entry.confidence,
    bbox_x: entry.bbox.x,
    bbox_y: entry.bbox.y,
    bbox_w: entry.bbox.w,
    bbox_h: entry.bbox.h,
    fps: entry.fps,
    frame_delay_ms: entry.frameDelayMs,
    pose_x: entry.pose?.x ?? null,
    pose_y: entry.pose?.y ?? null,
    pose_yaw: entry.pose?.yaw ?? null,
    snapshot_url: entry.snapshot_url
  };

  const res = await fetch(`${baseUrl}/api/history/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`history append failed: ${res.status}`);
  }
}

export async function syncConfidenceThreshold(baseUrl: string, threshold: number): Promise<void> {
  try {
    await fetch(`${baseUrl}/api/settings/threshold`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threshold }),
    });
  } catch {
    // 백엔드 미연결 시 무시 — UI 상태는 이미 반영됨
  }
}

export async function fetchHistoryLog(baseUrl: string): Promise<DetectionLogEntry[]> {
  const res = await fetch(`${baseUrl}/api/history`);
  if (!res.ok) {
    throw new Error(`history fetch failed: ${res.status}`);
  }
  const rows = (await res.json()) as HistoryRow[];
  // DB 행을 프론트엔드 타입으로 변환 후 최신순 정렬
  return rows
    .map(fromRow)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}