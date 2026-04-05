import { create } from "zustand";

const initialDetection = {
  class: "none",
  confidence: 0,
  bbox: { x: 0, y: 0, w: 0, h: 0 },
  fps: 0,
  frameDelayMs: 0,
};

const useRobotStore = create((set) => ({
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
