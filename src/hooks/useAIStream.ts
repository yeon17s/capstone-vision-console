import { useEffect, useRef } from "react";
import useRobotStore from "../store/robotStore";
import useSettingsStore, { isValidFrameDimension } from "../store/settingsStore";
import { appendHistoryLog } from "../lib/historyApi";
import type { DetectionLogEntry } from "../store/robotStore";



// 네트워크 장애 시 전송 실패한 로그를 localStorage에 보관했다가 재연결 시 재전송
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
    // 구형 포맷(baseUrl 없는 항목)은 현재 URL로 보정
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
    // localStorage 용량 초과 시 무시 (best-effort)
  }
}

function useAIStream(): void {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setDetection = useRobotStore((s) => s.setDetection);
  const setConnectionStatus = useRobotStore((s) => s.setConnectionStatus);
  const pushDetectionLog = useRobotStore((s) => s.pushDetectionLog);
  // 탐지 순간의 pose를 로그에 기록하기 위해 ref로 최신값 추적 (리렌더 없이 동기화)
  const poseRef = useRef(useRobotStore.getState().pose);
  const jetsonIp = useSettingsStore((s) => s.jetsonIp);
  const fastapiUrl = useSettingsStore((s) => s.fastapiUrl);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  // fastapiUrl이 변경되어도 클로저 내 최신값을 참조하기 위해 ref 사용
  const fastapiUrlRef = useRef(fastapiUrl);
  fastapiUrlRef.current = fastapiUrl;

  const pendingQueueRef = useRef<PendingHistoryItem[]>(loadPendingQueue(fastapiUrl));
  const isFlushingRef = useRef(false);

  useEffect(() => {
    // zustand 스토어 구독으로 pose 변경 시마다 ref 갱신
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
    // 중복 flush 방지: 이미 진행 중이거나 큐가 비어 있으면 스킵
    if (isFlushingRef.current || pendingQueueRef.current.length === 0) return;
    isFlushingRef.current = true;
    try {
      const targetBaseUrl = fastapiUrlRef.current;
      while (true) {
        // 현재 URL에 해당하는 항목만 순서대로 전송
        const nextIndex = pendingQueueRef.current.findIndex(
          (item) => item.baseUrl === targetBaseUrl
        );
        if (nextIndex === -1) break;

        const next = pendingQueueRef.current[nextIndex];
        try {
          await appendHistoryLog(next.baseUrl, next.entry);
          // 전송 성공 시 큐에서 제거
          pendingQueueRef.current = [
            ...pendingQueueRef.current.slice(0, nextIndex),
            ...pendingQueueRef.current.slice(nextIndex + 1),
          ];
          savePendingQueue(pendingQueueRef.current);
        } catch {
          // 전송 실패 시 재시도하지 않고 다음 flush 타이밍까지 대기
          break;
        }
      }
    } finally {
      isFlushingRef.current = false;
    }
  }

  useEffect(() => {
    // 10초마다 pending 큐 flush 시도 (연결 복구 후 자동 재전송)
    flushIntervalRef.current = setInterval(() => {
      void flushPendingQueue();
    }, FLUSH_INTERVAL_MS);

    // 페이지 종료 직전 큐를 localStorage에 저장해 데이터 유실 방지
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
        // 재연결 시 쌓인 pending 큐 즉시 flush
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
            snapshot_url?: string;
          };

          // 백엔드가 보내는 프레임 크기가 설정값과 다르면 동기화 (AIOverlay 좌표 계산에 사용)
          if (
            isValidFrameDimension(data.frame_width) &&
            isValidFrameDimension(data.frame_height)
          ) {
            const { frameWidth, frameHeight } = useSettingsStore.getState();
            if (frameWidth !== data.frame_width || frameHeight !== data.frame_height) {
              updateSettings({ frameWidth: data.frame_width, frameHeight: data.frame_height });
            }
          }

          // 알 수 없는 클래스는 "none"으로 정규화
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
            // snapshot_url 없는 탐지는 로그에 기록하지 않음
            if (!data.snapshot_url) return;

            // 탐지 시점의 pose를 스냅샷과 함께 기록
            const poseAtDetection = { ...poseRef.current };

            const logEntry: DetectionLogEntry = {
              ...detection,
              timestamp: data.timestamp,
              snapshot_url: data.snapshot_url,
              pose: poseAtDetection,
            };
            pushDetectionLog(logEntry);
            enqueue(logEntry);
            void flushPendingQueue();
          }
        } catch {
          // 비정상 WebSocket 메시지 무시
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setConnectionStatus("aiConnected", false);
        // 3초 후 재연결 시도 (onclose가 재연결을 전담, onerror는 close만 호출)
        reconnectTimerRef.current = setTimeout(() => {
          if (isMounted) connect();
        }, 3000);
      };

      ws.onerror = () => {
        // 에러 발생 시 close → onclose에서 재연결 처리
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