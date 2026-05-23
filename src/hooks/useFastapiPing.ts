import { useEffect } from "react";
import useRobotStore from "../store/robotStore";
import useSettingsStore from "../store/settingsStore";

const PING_INTERVAL_MS = 10_000;
const PING_TIMEOUT_MS  = 3_000;

export function useFastapiPing(): void {
  const setConnectionStatus = useRobotStore((s) => s.setConnectionStatus);
  const setLatencyMs        = useRobotStore((s) => s.setLatencyMs);
  const fastapiUrl          = useSettingsStore((s) => s.fastapiUrl);

  useEffect(() => {
    const controller = new AbortController();

    const check = async () => {
      const start = performance.now();
      try {
        const res = await fetch(`${fastapiUrl}/ping`, {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(PING_TIMEOUT_MS)]),
        });
        if (res.ok) {
          setLatencyMs(Math.round(performance.now() - start));
          setConnectionStatus("fastapiConnected", true);
        } else {
          setLatencyMs(null);
          setConnectionStatus("fastapiConnected", false);
        }
      } catch {
        // ignore aborts caused by URL change or unmount
        if (controller.signal.aborted) return;
        setLatencyMs(null);
        setConnectionStatus("fastapiConnected", false);
      }
    };

    check();
    const id = setInterval(check, PING_INTERVAL_MS);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [fastapiUrl, setConnectionStatus, setLatencyMs]);
}
