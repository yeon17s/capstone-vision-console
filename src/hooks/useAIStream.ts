import { useEffect, useRef } from "react";
import useRobotStore from "../store/robotStore";
import useSettingsStore from "../store/settingsStore";
import { appendHistoryLog } from "../lib/historyApi";
import type { DetectionLogEntry } from "../store/robotStore";

const LOG_THROTTLE_MS = 3000;
const FLUSH_INTERVAL_MS = 10_000;
const PENDING_QUEUE_KEY = "sentinel-pending-queue";

interface UseAIStreamOptions {
  capture?: (inverted: boolean) => string | undefined;
}

interface PendingHistoryItem {
  baseUrl: string;
  entry: DetectionLogEntry;
}

function stripSnapshots(entry: DetectionLogEntry): DetectionLogEntry {
  const { snapshotOriginal: _, snapshotInverted: __, ...rest } = entry;
  return rest;
}

function loadPendingQueue(defaultBaseUrl: string): PendingHistoryItem[] {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<PendingHistoryItem | DetectionLogEntry>;
    return parsed.map((item) => {
      if ("entry" in item && "baseUrl" in item) {
        return item;
      }
      // Backward compatibility for the previous queue shape.
      return { baseUrl: defaultBaseUrl, entry: item };
    });
  } catch {
    return [];
  }
}

function savePendingQueue(queue: PendingHistoryItem[]): void {
  try {
    const stripped = queue.map((item) => ({
      baseUrl: item.baseUrl,
      // Strip data URLs before persisting. Snapshots are large and not needed for CSV retry.
      entry: stripSnapshots(item.entry),
    }));
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(stripped));
  } catch {
    // storage full — best-effort
  }
}

function useAIStream({ capture }: UseAIStreamOptions = {}): void {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const invertedSnapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLoggedAtRef = useRef<number>(0);
  const captureRef = useRef(capture);
  captureRef.current = capture;

  const setDetection = useRobotStore((s) => s.setDetection);
  const setConnectionStatus = useRobotStore((s) => s.setConnectionStatus);
  const pushDetectionLog = useRobotStore((s) => s.pushDetectionLog);
  const poseRef = useRef(useRobotStore.getState().pose);
  const jetsonIp = useSettingsStore((s) => s.jetsonIp);
  const fastapiUrl = useSettingsStore((s) => s.fastapiUrl);
  const fastapiUrlRef = useRef(fastapiUrl);
  fastapiUrlRef.current = fastapiUrl;

  // Pending queue: entries awaiting successful CSV append, persisted to localStorage.
  // Each item carries its target baseUrl so settings changes cannot send old logs to a new backend.
  const pendingQueueRef = useRef<PendingHistoryItem[]>(loadPendingQueue(fastapiUrl));
  const isFlushingRef = useRef(false);

  // keep poseRef up-to-date without triggering re-render
  useEffect(() => {
    return useRobotStore.subscribe((state) => {
      poseRef.current = state.pose;
    });
  }, []);

  function enqueue(entry: DetectionLogEntry) {
    pendingQueueRef.current = [
      ...pendingQueueRef.current,
      { baseUrl: fastapiUrlRef.current, entry },
    ];
    savePendingQueue(pendingQueueRef.current);
  }

  // Flush pending queue sequentially for the active backend.
  // Stop on first failure to preserve CSV append order for that backend.
  async function flushPendingQueue() {
    if (isFlushingRef.current || pendingQueueRef.current.length === 0) return;
    isFlushingRef.current = true;
    try {
      const targetBaseUrl = fastapiUrlRef.current;
      while (true) {
        const nextIndex = pendingQueueRef.current.findIndex(
          (item) => item.baseUrl === targetBaseUrl
        );
        if (nextIndex === -1) break;

        const next = pendingQueueRef.current[nextIndex];
        try {
          await appendHistoryLog(next.baseUrl, next.entry);
          pendingQueueRef.current = [
            ...pendingQueueRef.current.slice(0, nextIndex),
            ...pendingQueueRef.current.slice(nextIndex + 1),
          ];
          savePendingQueue(pendingQueueRef.current);
        } catch {
          break;
        }
      }
    } finally {
      isFlushingRef.current = false;
    }
  }

  // periodic retry + beforeunload best-effort flush
  useEffect(() => {
    flushIntervalRef.current = setInterval(() => {
      void flushPendingQueue();
    }, FLUSH_INTERVAL_MS);

    function handleUnload() {
      // synchronous best-effort: persist queue so it survives reload
      savePendingQueue(pendingQueueRef.current);
    }
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
      window.removeEventListener("beforeunload", handleUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      const ws = new WebSocket(`ws://${jetsonIp}:8000/ws/ai_stream`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setConnectionStatus("aiConnected", true);
        // attempt to drain pending queue on reconnect
        void flushPendingQueue();
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data as string) as {
            timestamp: string;
            class: string;
            confidence: number;
            bbox: { x: number; y: number; w: number; h: number };
            fps: number;
            frame_delay_ms: number;
          };

          const cls = data.class === "person" || data.class === "none" ? data.class : "none";

          const detection = {
            class: cls,
            confidence: data.confidence,  // 0–100 range from server
            bbox: data.bbox,
            fps: data.fps,
            frameDelayMs: data.frame_delay_ms,
          };

          setDetection(detection);

          if (cls === "person") {
            const now = Date.now();
            if (now - lastLoggedAtRef.current < LOG_THROTTLE_MS) return;
            lastLoggedAtRef.current = now;

            const snapshotOriginal = captureRef.current?.(false);
            const poseAtDetection = { ...poseRef.current };

            if (invertedSnapshotTimerRef.current) {
              clearTimeout(invertedSnapshotTimerRef.current);
            }

            invertedSnapshotTimerRef.current = setTimeout(() => {
              if (!isMounted) return;
              let snapshotInverted: string | undefined;
              try {
                snapshotInverted = captureRef.current?.(true);
              } catch {
                snapshotInverted = undefined;
              }
              const logEntry: DetectionLogEntry = {
                ...detection,
                timestamp: data.timestamp,
                snapshotOriginal,
                snapshotInverted,
                pose: poseAtDetection,
              };
              pushDetectionLog(logEntry);

              // All CSV writes go through the queue so append order is controlled in one place.
              enqueue(logEntry);
              void flushPendingQueue();
            }, 1500);
          }
        } catch {
          // malformed message — ignore
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setConnectionStatus("aiConnected", false);
        reconnectTimerRef.current = setTimeout(() => {
          if (isMounted) connect();
        }, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (invertedSnapshotTimerRef.current) clearTimeout(invertedSnapshotTimerRef.current);
      wsRef.current?.close();
    };
  }, [jetsonIp, setDetection, setConnectionStatus, pushDetectionLog, fastapiUrl]);
}

export default useAIStream;
