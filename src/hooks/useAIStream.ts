import { useEffect, useRef } from "react";
import useRobotStore from "../store/robotStore";
import useSettingsStore, { isValidFrameDimension } from "../store/settingsStore";
import { appendHistoryLog } from "../lib/historyApi";
import type { DetectionLogEntry } from "../store/robotStore";



const FLUSH_INTERVAL_MS = 10_000;
const PENDING_QUEUE_KEY = "sentinel-pending-queue";

interface PendingHistoryItem {
  baseUrl: string;
  entry: DetectionLogEntry;
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
      return { baseUrl: defaultBaseUrl, entry: item as DetectionLogEntry };
    });
  } catch {
    return [];
  }
}

function savePendingQueue(queue: PendingHistoryItem[]): void {
  try {
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // storage full — best-effort
  }
}

function useAIStream(): void {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setDetection = useRobotStore((s) => s.setDetection);
  const setConnectionStatus = useRobotStore((s) => s.setConnectionStatus);
  const pushDetectionLog = useRobotStore((s) => s.pushDetectionLog);
  const poseRef = useRef(useRobotStore.getState().pose);
  const jetsonIp = useSettingsStore((s) => s.jetsonIp);
  const fastapiUrl = useSettingsStore((s) => s.fastapiUrl);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const fastapiUrlRef = useRef(fastapiUrl);
  fastapiUrlRef.current = fastapiUrl;

  const pendingQueueRef = useRef<PendingHistoryItem[]>(loadPendingQueue(fastapiUrl));
  const isFlushingRef = useRef(false);

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

  useEffect(() => {
    flushIntervalRef.current = setInterval(() => {
      void flushPendingQueue();
    }, FLUSH_INTERVAL_MS);

    function handleUnload() {
      savePendingQueue(pendingQueueRef.current);
    }
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
      window.removeEventListener("beforeunload", handleUnload);
    };
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
            frame_width?: number;
            frame_height?: number;
            snapshot_url?: string; //백엔드에서 보내주는 사진 주소
          };

          if (
            isValidFrameDimension(data.frame_width) &&
            isValidFrameDimension(data.frame_height)
          ) {
            const { frameWidth, frameHeight } = useSettingsStore.getState();
            if (frameWidth !== data.frame_width || frameHeight !== data.frame_height) {
              updateSettings({ frameWidth: data.frame_width, frameHeight: data.frame_height });
            }
          }

          const cls = data.class === "person" || data.class === "none" ? data.class : "none";

          const detection = {
            class: cls,
            confidence: data.confidence,
            bbox: data.bbox,
            fps: data.fps,
            frameDelayMs: data.frame_delay_ms,
          };

          setDetection(detection);

          if (cls === "person") {
            if (!data.snapshot_url) return;

            const poseAtDetection = { ...poseRef.current };

            const logEntry: DetectionLogEntry = {
              ...detection,
              timestamp: data.timestamp,
              snapshot_url: data.snapshot_url, //URL 바로 맵핑
              pose: poseAtDetection,
            };
            pushDetectionLog(logEntry);
            enqueue(logEntry);
            void flushPendingQueue();
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
      wsRef.current?.close();
    };
  }, [jetsonIp, setDetection, setConnectionStatus, pushDetectionLog, fastapiUrl, updateSettings]);
}

export default useAIStream;