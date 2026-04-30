import { useEffect, useRef } from "react";
import useRobotStore from "../store/robotStore";
import useSettingsStore from "../store/settingsStore";

interface UseAIStreamOptions {
  capture?: (inverted: boolean) => string | undefined;
}

function useAIStream({ capture }: UseAIStreamOptions = {}): void {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
            const snapshotOriginal = captureRef.current?.(false);

            // capture inverted snapshot ~1.5s after detection
            setTimeout(() => {
              if (!isMounted) return;
              const snapshotInverted = captureRef.current?.(true);
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
      wsRef.current?.close();
    };
  }, [jetsonIp, setDetection, setConnectionStatus, pushDetectionLog]);
}

export default useAIStream;
