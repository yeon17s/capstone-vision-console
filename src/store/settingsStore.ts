import { create } from "zustand";

interface SettingsData {
  jetsonIp: string;
  rosbridgePort: number;
  fastapiUrl: string;
  confidenceThreshold: number;
  audioAlarmEnabled: boolean;
  volume: number;
  storagePolicy: "original" | "original+inverted";
}

interface SettingsState extends SettingsData {
  hydrateSettings: () => void;
  updateSettings: (updates: Partial<SettingsData>) => void;
}

const STORAGE_KEY = "sentinel-ui-settings";

const defaultSettings: SettingsData = {
  jetsonIp: "192.168.0.45",
  rosbridgePort: 9090,
  fastapiUrl: "http://121.156.245.81:8000",
  confidenceThreshold: 50,  // 0–100 range, matches robotStore.detection.confidence
  audioAlarmEnabled: true,
  volume: 70,
  storagePolicy: "original",
};

function migrateSettings(raw: Partial<SettingsData>): Partial<SettingsData> {
  const migrated = { ...raw };
  // confidenceThreshold was stored as 0–1 before migration to 0–100
  if (
    typeof migrated.confidenceThreshold === "number" &&
    migrated.confidenceThreshold <= 1
  ) {
    migrated.confidenceThreshold = Math.round(migrated.confidenceThreshold * 100);
  }
  return migrated;
}

function loadSettings(): SettingsData {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultSettings;
    const parsed = migrateSettings(JSON.parse(stored) as Partial<SettingsData>);
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

function persistSettings(settings: SettingsData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadSettings(),

  hydrateSettings: () => set(loadSettings()),

  updateSettings: (updates) => {
    const next: SettingsData = { ...get(), ...updates };
    persistSettings(next);
    set(updates);
  },
}));

export default useSettingsStore;
