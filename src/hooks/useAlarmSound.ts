import { useEffect, useRef } from "react";
import useRobotStore from "../store/robotStore";
import useSettingsStore from "../store/settingsStore";

const ALARM_SRC = "/sounds/alarm.mp3";

export function useAlarmSound(): void {
  const recentLog = useRobotStore((s) => s.recentLog);
  const audioAlarmEnabled = useSettingsStore((s) => s.audioAlarmEnabled);
  const volume = useSettingsStore((s) => s.volume);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTimestampRef = useRef<string | null>(null);

  // 슬라이더 변경 즉시 볼륨 반영 (재생 중에도 적용)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    const latest = recentLog[0];
    if (!latest) return;
    // 같은 탐지 항목에 중복 재생 방지 (timestamp로 구분)
    if (latest.timestamp === lastTimestampRef.current) return;
    lastTimestampRef.current = latest.timestamp;

    if (!audioAlarmEnabled) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(ALARM_SRC);
    }
    const audio = audioRef.current;
    audio.volume = volume / 100;
    // 이전 재생 중이어도 처음부터 재시작
    audio.currentTime = 0;
    audio.play().catch(() => undefined);
  // volume은 위 별도 effect에서 동기화하므로 의존성 배열에서 의도적으로 제외
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentLog, audioAlarmEnabled]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
}
