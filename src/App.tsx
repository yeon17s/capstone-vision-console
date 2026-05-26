import { useState } from "react";
import TopBar from "./components/layout/TopBar";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Settings from "./pages/Settings";
import useAIStream from "./hooks/useAIStream";
import useRosConnection from "./hooks/useRosConnection";
import { useAlarmSound } from "./hooks/useAlarmSound";
import { useFastapiPing } from "./hooks/useFastapiPing";

//import type { CaptureResult } from "./hooks/useVideoCapture"; useVideoCapture 파일 삭제
// 캡처 관련 로직 전부 삭제하고 AI Stream만 호출

type TabName = "Dashboard" | "History" | "Settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>("Dashboard");

  useAIStream(); 
  useRosConnection();
  useAlarmSound();
  useFastapiPing();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-mission-bg text-mission-text">
      <TopBar activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "Dashboard" && <Dashboard />}
      {activeTab === "History" && <History />}
      {activeTab === "Settings" && <Settings />}
    </div>
  );
}