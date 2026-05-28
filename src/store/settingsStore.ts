import { create } from "zustand";

interface SettingsData {
  jetsonIp: string;
  rosbridgePort: number;
  fastapiUrl: string;
  confidenceThreshold: number;
  audioAlarmEnabled: boolean;
  volume: number;
  storagePolicy: "original" | "original+inverted";
  frameWidth: number;   // AI 소스 프레임 크기 — WS 메시지에 frame_width 없을 때 폴백
  frameHeight: number;
  autoScanEnabled: boolean;  // 탐지 시 로봇 자동 좌우 스캔 여부
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
  confidenceThreshold: 50,  // 0~100 범위, robotStore.detection.confidence와 스케일 일치
  audioAlarmEnabled: true,
  volume: 70,
  storagePolicy: "original",
  frameWidth: DEFAULT_FRAME_WIDTH,
  frameHeight: DEFAULT_FRAME_HEIGHT,
  autoScanEnabled: false,
};

function migrateSettings(raw: Partial<SettingsData>): Partial<SettingsData> {
  const migrated = { ...raw };
  // confidenceThreshold가 이전에 0~1 범위로 저장된 경우 0~100으로 마이그레이션
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
    autoScanEnabled: settings.autoScanEnabled,
  };
}

function loadSettings(): SettingsData {
  // SSR 환경(window 없음)에서는 기본값 사용
  if (typeof window === "undefined") return defaultSettings;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultSettings;
    // 저장된 값을 마이그레이션 후 기본값과 병합 (새 필드 누락 대비)
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
    // 부분 업데이트도 마이그레이션을 거쳐 스케일 불일치 방지
    const next: SettingsData = { ...toSettingsData(get()), ...migrateSettings(updates) };
    persistSettings(next);
    set(next);
  },
}));

export default useSettingsStore;
