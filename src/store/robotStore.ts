import { create } from "zustand";

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Pose {
  x: number;
  y: number;
  yaw: number;
}

export interface Detection {
  class: string;
  confidence: number;  // 0~100 퍼센트 스케일
  bbox: BBox;
  fps: number;
  frameDelayMs: number;
}

export type SnapshotStatus = "ok" | "cors_error" | "canvas_error" | "skipped" | "unavailable";

export interface DetectionLogEntry extends Detection {
  timestamp: string;
  snapshot_url?: string;
  pose?: Pose;
}

type ConnectionKey = "rosConnected" | "aiConnected" | "cameraConnected" | "fastapiConnected";

interface RobotState {
  rosConnected: boolean;
  aiConnected: boolean;
  cameraConnected: boolean;
  fastapiConnected: boolean;
  batteryPercent: number;
  latencyMs: number | null;  // null = 아직 측정 없음 또는 마지막 ping 실패
  pose: Pose;
  detection: Detection;

  // 세션 중 최근 탐지 목록 (메모리 절약을 위해 최대 50개로 제한)
  recentLog: DetectionLogEntry[];
  // 젯슨 DB + 세션 탐지를 합산한 전체 히스토리 (History 페이지 소스)
  historyLog: DetectionLogEntry[];

  setConnectionStatus: (key: ConnectionKey, value: boolean) => void;
  setBatteryPercent: (batteryPercent: number) => void;
  setLatencyMs: (latencyMs: number | null) => void;
  setPose: (pose: Pose) => void;
  setDetection: (detection: Detection) => void;
  clearDetection: () => void;
  pushDetectionLog: (entry: DetectionLogEntry) => void;
  // 젯슨 DB에서 가져온 항목을 historyLog에 병합 (timestamp 기준 중복 제거, 최신순)
  mergeHistoryLog: (entries: DetectionLogEntry[]) => void;
  clearDetectionLog: () => void;
}

const RECENT_LOG_CAP = 50;

const initialDetection: Detection = {
  class: "none",
  confidence: 0,
  bbox: { x: 0, y: 0, w: 0, h: 0 },
  fps: 0,
  frameDelayMs: 0,
};

const useRobotStore = create<RobotState>((set) => ({
  rosConnected: false,
  aiConnected: false,
  cameraConnected: false,
  fastapiConnected: false,
  batteryPercent: 0,
  latencyMs: null,
  pose: { x: 0, y: 0, yaw: 0 },
  detection: initialDetection,
  recentLog: [],
  historyLog: [],

  setConnectionStatus: (key, value) => set({ [key]: value }),
  setBatteryPercent: (batteryPercent) => set({ batteryPercent }),
  setLatencyMs: (latencyMs) => set({ latencyMs }),
  setPose: (pose) => set({ pose }),
  setDetection: (detection) => set({ detection }),
  clearDetection: () => set({ detection: initialDetection }),

  pushDetectionLog: (entry) =>
    set((state) => {
      // historyLog upsert: 라이브 항목(snapshot 포함)이 기존 항목보다 우선
      const existsInHistory = state.historyLog.some((e) => e.timestamp === entry.timestamp);
      const historyLog = existsInHistory
        ? state.historyLog.map((e) => (e.timestamp === entry.timestamp ? entry : e))
        : [entry, ...state.historyLog];

      // recentLog: timestamp 기준 중복 제거 후 최대 개수로 자름
      const existsInRecent = state.recentLog.some((e) => e.timestamp === entry.timestamp);
      const recentLog = (
        existsInRecent
          ? state.recentLog.map((e) => (e.timestamp === entry.timestamp ? entry : e))
          : [entry, ...state.recentLog]
      ).slice(0, RECENT_LOG_CAP);

      return { historyLog, recentLog };
    }),

  mergeHistoryLog: (fetched) =>
    set((state) => {
      // 라이브 항목이 이미 있으면 유지하고, 없는 항목만 DB 데이터로 채움
      const map = new Map<string, DetectionLogEntry>(
        state.historyLog.map((e) => [e.timestamp, e])
      );
      for (const entry of fetched) {
        if (!map.has(entry.timestamp)) {
          map.set(entry.timestamp, entry);
        }
      }
      const merged = Array.from(map.values()).sort((a, b) =>
        b.timestamp.localeCompare(a.timestamp)
      );
      return { historyLog: merged };
    }),

  clearDetectionLog: () => set({ recentLog: [], historyLog: [] }),
}));

export default useRobotStore;
