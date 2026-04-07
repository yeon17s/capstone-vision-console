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
  confidence: number;  // 0–1
  bbox: BBox;
  fps: number;
  frameDelayMs: number;
  mode?: string;
}

export interface DetectionLogEntry extends Detection {
  timestamp: string;
}

type ConnectionKey = "rosConnected" | "aiConnected" | "cameraConnected";

interface RobotState {
  rosConnected: boolean;
  aiConnected: boolean;
  cameraConnected: boolean;
  driveMode: DriveMode;
  batteryPercent: number;
  pose: Pose;
  detection: Detection;
  detectionLog: DetectionLogEntry[];
  setConnectionStatus: (key: ConnectionKey, value: boolean) => void;
  setDriveMode: (driveMode: DriveMode) => void;
  setBatteryPercent: (batteryPercent: number) => void;
  setPose: (pose: Pose) => void;
  setDetection: (detection: Detection) => void;
  clearDetection: () => void;
  pushDetectionLog: (entry: DetectionLogEntry) => void;
  clearDetectionLog: () => void;
}

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
  driveMode: "manual",
  batteryPercent: 0,
  pose: { x: 0, y: 0, yaw: 0 },
  detection: initialDetection,
  detectionLog: [],

  setConnectionStatus: (key, value) => set({ [key]: value }),
  setDriveMode: (driveMode) => set({ driveMode }),
  setBatteryPercent: (batteryPercent) => set({ batteryPercent }),
  setPose: (pose) => set({ pose }),
  setDetection: (detection) => set({ detection }),
  clearDetection: () => set({ detection: initialDetection }),
  pushDetectionLog: (entry) =>
    set((state) => ({
      detectionLog: [entry, ...state.detectionLog].slice(0, 50),
    })),
  clearDetectionLog: () => set({ detectionLog: [] }),
}));

export default useRobotStore;
