import { useState, useRef, useCallback } from "react";
import TopBar from "./components/layout/TopBar";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Settings from "./pages/Settings";
import useAIStream from "./hooks/useAIStream";
import useRosConnection from "./hooks/useRosConnection";

type TabName = "Dashboard" | "History" | "Settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>("Dashboard");

  const captureRef = useRef<((inverted: boolean) => string | undefined) | undefined>(undefined);

  const handleCaptureReady = useCallback((fn: (inverted: boolean) => string | undefined) => {
    captureRef.current = fn;
    return () => { captureRef.current = undefined; };
  }, []);

  useAIStream({ capture: (inverted) => captureRef.current?.(inverted) });
  useRosConnection();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-mission-bg text-mission-text">
      <TopBar activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "Dashboard" && <Dashboard onCaptureReady={handleCaptureReady} />}
      {activeTab === "History" && <History />}
      {activeTab === "Settings" && <Settings />}
    </div>
  );
}
