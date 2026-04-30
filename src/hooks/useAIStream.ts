import { useEffect, useRef } from "react";
import useRobotStore from "../store/robotStore";
import useSettingsStore from "../store/settingsStore";

const LOG_THROTTLE_MS = 3000; // minimum ms between detection log entries

interface UseAIStreamOptions {
  capture?: (inverted: boolean) => string | undefined;
}

function useAIStream({ capture }: UseAIStreamOptions = {}): void {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const invertedSnapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoggedAtRef = useRef<number>(0);
  const captureRef = useRef(capture);
  captureRef.current = capture;

  const setDetection = useRobotStore((s) => s.setDetection);
  const setConnectionStatus = useRobotStore((s) => s.setConnectionStatus);
  const pushDetectionLog = useRobotStore((s) => s.pushDetectionLog);
  const jetsonIp = useSettingsStore((s) => s.jetsonIp);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      const ws = new WebSocket(`ws://${jetsonIp}:8000/ws/ai_stream`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        setConnectionStatus("aiConnected", true);
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

            // cancel any pending inverted capture from previous log
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
              pushDetectionLog({
                ...detection,
                timestamp: data.timestamp,
                snapshotOriginal,
                snapshotInverted,
              });
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
  }, [jetsonIp, setDetection, setConnectionStatus, pushDetectionLog]);
}

export default useAIStream;
