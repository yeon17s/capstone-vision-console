export function confTone(conf: number): "success" | "warning" | "muted" {
  if (conf >= 85) return "success";
  if (conf >= 70) return "warning";
  return "muted";
}
