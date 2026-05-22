import type { DetectionLogEntry, SnapshotStatus } from "../store/robotStore";

// Flat CSV row shape the backend expects/returns.
export interface HistoryRow {
  timestamp: string;
  confidence: number | string;
  bbox_x: number | string;
  bbox_y: number | string;
  bbox_w: number | string;
  bbox_h: number | string;
  fps: number | string;
  frame_delay_ms: number | string;
  pose_x?: number | string | null;
  pose_y?: number | string | null;
  pose_yaw?: number | string | null;
  snapshot_status: "captured" | "unavailable";
}

function safeNum(v: number | string | null | undefined, fallback: number): number {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toRow(entry: DetectionLogEntry): HistoryRow {
  return {
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
    snapshot_status: entry.snapshotOriginal ? "captured" : "unavailable",
  };
}

const CSV_STATUS_MAP: Record<HistoryRow["snapshot_status"], SnapshotStatus> = {
  captured:    "ok",
  unavailable: "unavailable",
};

function fromRow(row: HistoryRow): DetectionLogEntry {
  const poseX = safeNum(row.pose_x, NaN);
  const poseY = safeNum(row.pose_y, NaN);
  const poseYaw = safeNum(row.pose_yaw, NaN);
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
    snapshotOriginalStatus: CSV_STATUS_MAP[row.snapshot_status],
  };
}

export async function appendHistoryLog(
  baseUrl: string,
  entry: DetectionLogEntry
): Promise<void> {
  const res = await fetch(`${baseUrl}/api/history/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toRow(entry)),
  });
  if (!res.ok) {
    throw new Error(`history append failed: ${res.status}`);
  }
}

export async function fetchHistoryLog(baseUrl: string): Promise<DetectionLogEntry[]> {
  const res = await fetch(`${baseUrl}/api/history`);
  if (!res.ok) {
    throw new Error(`history fetch failed: ${res.status}`);
  }
  const rows = (await res.json()) as HistoryRow[];
  return rows
    .map(fromRow)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // newest-first, regardless of backend order
}
