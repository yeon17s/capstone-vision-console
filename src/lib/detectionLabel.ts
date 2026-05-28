export interface DetectionLabelInfo {
  full: string;
  short: string;
}

const LABEL_MAP: Record<string, DetectionLabelInfo> = {
  cod:        { full: "Camouflaged Object Detected", short: "COD" },
  camouflage: { full: "Camouflaged Object Detected", short: "COD" },
};

const DEFAULT_LABEL: DetectionLabelInfo = { full: "Object detected", short: "Object" };

export function detectionLabel(cls: string): DetectionLabelInfo {
  return LABEL_MAP[cls?.toLowerCase()] ?? DEFAULT_LABEL;
}
