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

  // sync volume immediately when the slider changes, even during playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // play once per new detection log entry
  useEffect(() => {
    const latest = recentLog[0];
    if (!latest) return;
    if (latest.timestamp === lastTimestampRef.current) return;
    lastTimestampRef.current = latest.timestamp;

    if (!audioAlarmEnabled) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(ALARM_SRC);
    }
    const audio = audioRef.current;
    audio.volume = volume / 100;
    audio.currentTime = 0;
    audio.play().catch(() => undefined);
  // volume is synced by the separate effect above; intentionally excluded here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentLog, audioAlarmEnabled]);

  // release Audio object on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
}
