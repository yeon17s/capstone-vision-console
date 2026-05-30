let _clear: (() => void) | null = null;

export function registerClearPendingQueue(fn: () => void): void {
  _clear = fn;
}

export function clearPendingQueue(): void {
  _clear?.();
}
