// E-Stop, Auto Scan Off, ROS disconnect 등 외부에서 진행 중 스캔을 취소하기 위한 싱글턴
let _cancel: (() => void) | null = null;

export function registerCancelAutoScan(fn: () => void): void {
  _cancel = fn;
}

export function cancelAutoScan(): void {
  _cancel?.();
}
