import { useState } from "react";
import TopBar from "./components/layout/TopBar";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Settings from "./pages/Settings";
import useAIStream from "./hooks/useAIStream";
import useRosConnection from "./hooks/useRosConnection";
import { useAlarmSound } from "./hooks/useAlarmSound";
import { useFastapiPing } from "./hooks/useFastapiPing";

type TabName = "Dashboard" | "History" | "Settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>("Dashboard");

  // 탭 전환 시에도 연결이 유지되도록 앱 루트에서 공통 훅 실행
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