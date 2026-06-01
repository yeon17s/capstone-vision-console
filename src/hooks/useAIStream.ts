import { useEffect, useRef } from "react";
import useRobotStore from "../store/robotStore";
import useSettingsStore, { isValidFrameDimension } from "../store/settingsStore";
import { appendHistoryLog } from "../lib/historyApi";
import { publishCmdVel } from "../lib/rosClient";
import { registerCancelAutoScan } from "../lib/autoScanController";
import { registerClearPendingQueue } from "../lib/pendingQueueController";
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

const SCAN_COOLDOWN_MS = 15_000;
const SCAN_AZ = 0.4;            // rad/s 회전 속도
const SCAN_PUBLISH_INTERVAL_MS = 150; // DriveController watchdog 주기와 동일

function useAIStream(): void {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scanIntervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const scanInProgressRef = useRef(false);
  const lastScanTimeRef = useRef(0);

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

  function clearScanTimers() {
    scanTimersRef.current.forEach(clearTimeout);
    scanTimersRef.current = [];
    scanIntervalsRef.current.forEach(clearInterval);
    scanIntervalsRef.current = [];
    if (scanInProgressRef.current) {
      publishCmdVel(0, 0);
      scanInProgressRef.current = false;
    }
  }

  // confidence ≥ threshold 탐지 시 로봇이 좌→우→복귀 스캔 동작 (약 8초)
  // 각 구간마다 150ms 간격으로 cmd_vel 재전송 (ROS watchdog 대응)
  // E-Stop·Auto Scan Off·ROS 단절 시 즉시 중단
  function triggerAutoScan() {
    const now = Date.now();
    if (scanInProgressRef.current || now - lastScanTimeRef.current < SCAN_COOLDOWN_MS) return;
    if (!useRobotStore.getState().rosConnected) return;

    scanInProgressRef.current = true;
    lastScanTimeRef.current = now;

    function startPhase(az: number): ReturnType<typeof setInterval> {
      publishCmdVel(0, az);
      const id = setInterval(() => publishCmdVel(0, az), SCAN_PUBLISH_INTERVAL_MS);
      scanIntervalsRef.current.push(id);
      return id;
    }

    function stillActive(): boolean {
      return (
        useSettingsStore.getState().autoScanEnabled &&
        useRobotStore.getState().rosConnected
      );
    }

    const i1 = startPhase(SCAN_AZ);
    const t1 = setTimeout(() => {
      clearInterval(i1);
      if (!stillActive()) { clearScanTimers(); return; }

      const i2 = startPhase(-SCAN_AZ);
      const t2 = setTimeout(() => {
        clearInterval(i2);
        if (!stillActive()) { clearScanTimers(); return; }

        const i3 = startPhase(SCAN_AZ);
        const t3 = setTimeout(() => {
          clearInterval(i3);
          publishCmdVel(0, 0);
          scanInProgressRef.current = false;
          scanTimersRef.current = [];
          scanIntervalsRef.current = [];
        }, 2000);
        scanTimersRef.current.push(t3);
      }, 4000);
      scanTimersRef.current.push(t2);
    }, 2000);
    scanTimersRef.current.push(t1);
  }

  useEffect(() => {
    registerCancelAutoScan(clearScanTimers);
  }, []); // clearScanTimers는 stable ref만 참조하므로 deps 불필요

  useEffect(() => {
    registerClearPendingQueue(() => {
      pendingQueueRef.current = [];
      savePendingQueue([]);
    });
  }, []);

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
            // Auto Scan: snapshot 여부와 무관하게 탐지 즉시 판단
            const { autoScanEnabled, confidenceThreshold } = useSettingsStore.getState();
            if (autoScanEnabled && data.confidence >= confidenceThreshold) {
              triggerAutoScan();
            }

            // snapshot_url 없는 탐지는 로그에 기록하지 않음
            if (!data.snapshot_url) return;

            // 탐지 시점의 pose를 스냅샷과 함께 기록
            const poseAtDetection = { ...poseRef.current };

            const rawSnapshotUrl = data.snapshot_url;
            const snapshot_url = rawSnapshotUrl
              ? rawSnapshotUrl.replace(/^https?:\/\/[^/]+/, fastapiUrlRef.current.replace(/\/$/, ""))
              : undefined;

            const logEntry: DetectionLogEntry = {
              ...detection,
              timestamp: data.timestamp,
              snapshot_url,
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
      clearScanTimers();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [jetsonIp, setDetection, setConnectionStatus, pushDetectionLog, fastapiUrl, updateSettings]);
}

export default useAIStream;