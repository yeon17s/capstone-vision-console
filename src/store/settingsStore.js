import { create } from "zustand";

const STORAGE_KEY = "sentinel-ui-settings";

const defaultSettings = {
  jetsonIp: "192.168.0.45",
  rosbridgePort: 9090,
  fastapiUrl: "http://121.156.245.81:8000",
  confidenceThreshold: 0.5,
  audioAlarmEnabled: true,
};

const loadSettings = () => {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

const persistSettings = (settings) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

const useSettingsStore = create((set) => ({
  ...loadSettings(),
  hydrateSettings: () => set(loadSettings()),
  updateSettings: (updates) =>
    set((state) => {
      const nextState = { ...state, ...updates };
      persistSettings(nextState);
      return updates;
    }),
}));

export default useSettingsStore;
