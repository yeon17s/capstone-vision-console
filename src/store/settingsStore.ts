import { create } from "zustand";

interface SettingsData {
  jetsonIp: string;
  rosbridgePort: number;
  fastapiUrl: string;
  confidenceThreshold: number;
  audioAlarmEnabled: boolean;
  volume: number;
  storagePolicy: "original" | "original+inverted";
  frameWidth: number;   // AI source frame size — fallback when WS payload omits frame_width
  frameHeight: number;
}

interface SettingsState extends SettingsData {
  hydrateSettings: () => void;
  updateSettings: (updates: Partial<SettingsData>) => void;
}

const STORAGE_KEY = "sentinel-ui-settings";
export const DEFAULT_FRAME_WIDTH = 640;
export const DEFAULT_FRAME_HEIGHT = 480;

export function isValidFrameDimension(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

const defaultSettings: SettingsData = {
  jetsonIp: "192.168.0.45",
  rosbridgePort: 9090,
  fastapiUrl: "http://121.156.245.81:8000",
  confidenceThreshold: 50,  // 0–100 range, matches robotStore.detection.confidence
  audioAlarmEnabled: true,
  volume: 70,
  storagePolicy: "original",
  frameWidth: DEFAULT_FRAME_WIDTH,
  frameHeight: DEFAULT_FRAME_HEIGHT,
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
  if (!isValidFrameDimension(migrated.frameWidth)) {
    delete migrated.frameWidth;
  }
  if (!isValidFrameDimension(migrated.frameHeight)) {
    delete migrated.frameHeight;
  }
  return migrated;
}

function toSettingsData(settings: SettingsData): SettingsData {
  return {
    jetsonIp: settings.jetsonIp,
    rosbridgePort: settings.rosbridgePort,
    fastapiUrl: settings.fastapiUrl,
    confidenceThreshold: settings.confidenceThreshold,
    audioAlarmEnabled: settings.audioAlarmEnabled,
    volume: settings.volume,
    storagePolicy: settings.storagePolicy,
    frameWidth: settings.frameWidth,
    frameHeight: settings.frameHeight,
  };
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
    const next: SettingsData = { ...toSettingsData(get()), ...migrateSettings(updates) };
    persistSettings(next);
    set(next);
  },
}));

export default useSettingsStore;
