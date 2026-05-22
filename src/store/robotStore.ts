import { create } from "zustand";

export type DriveMode = "auto" | "manual";

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
  confidence: number;  // 0–100 (percent scale)
  bbox: BBox;
  fps: number;
  frameDelayMs: number;
  mode?: string;
}

export interface DetectionLogEntry extends Detection {
  timestamp: string;
  snapshotOriginal?: string;  // data URL, captured at detection moment
  snapshotInverted?: string;  // data URL, captured 1–2s after detection
  pose?: Pose;                // robot pose at detection moment
}

type ConnectionKey = "rosConnected" | "aiConnected" | "cameraConnected" | "fastapiConnected";

interface RobotState {
  rosConnected: boolean;
  aiConnected: boolean;
  cameraConnected: boolean;
  fastapiConnected: boolean;
  driveMode: DriveMode;
  batteryPercent: number;
  pose: Pose;
  detection: Detection;

  // live feed: recent detections from this session, capped to avoid memory growth
  recentLog: DetectionLogEntry[];
  // full history: merged from Jetson CSV + live session, no cap (History page source)
  historyLog: DetectionLogEntry[];

  setConnectionStatus: (key: ConnectionKey, value: boolean) => void;
  setDriveMode: (driveMode: DriveMode) => void;
  setBatteryPercent: (batteryPercent: number) => void;
  setPose: (pose: Pose) => void;
  setDetection: (detection: Detection) => void;
  clearDetection: () => void;
  // push one new entry into both logs
  pushDetectionLog: (entry: DetectionLogEntry) => void;
  // merge fetched CSV entries into historyLog (dedupe by timestamp, newest-first)
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
  driveMode: "manual",
  batteryPercent: 0,
  pose: { x: 0, y: 0, yaw: 0 },
  detection: initialDetection,
  recentLog: [],
  historyLog: [],

  setConnectionStatus: (key, value) => set({ [key]: value }),
  setDriveMode: (driveMode) => set({ driveMode }),
  setBatteryPercent: (batteryPercent) => set({ batteryPercent }),
  setPose: (pose) => set({ pose }),
  setDetection: (detection) => set({ detection }),
  clearDetection: () => set({ detection: initialDetection }),

  pushDetectionLog: (entry) =>
    set((state) => {
      // upsert into historyLog: live entry (may have snapshot) always wins over existing
      const existsInHistory = state.historyLog.some((e) => e.timestamp === entry.timestamp);
      const historyLog = existsInHistory
        ? state.historyLog.map((e) => (e.timestamp === entry.timestamp ? entry : e))
        : [entry, ...state.historyLog];

      // dedupe recentLog by timestamp, then cap
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
      // build a map from existing entries keyed by timestamp
      const map = new Map<string, DetectionLogEntry>(
        state.historyLog.map((e) => [e.timestamp, e])
      );
      // fetched entries fill in any missing entries; live entries (with snapshots) win
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
