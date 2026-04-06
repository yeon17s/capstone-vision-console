import { useState } from "react";
import TopBar from "./components/layout/TopBar";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Settings from "./pages/Settings";

type TabName = "Dashboard" | "History" | "Settings";

const tabs: Record<TabName, React.ComponentType> = {
  Dashboard,
  History,
  Settings,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>("Dashboard");
  const ActivePage = tabs[activeTab] ?? Dashboard;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-mission-bg text-mission-text">
      <TopBar activeTab={activeTab} onTabChange={setActiveTab} />
      <ActivePage />
    </div>
  );
}
