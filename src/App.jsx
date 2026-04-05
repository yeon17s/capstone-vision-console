import { useState } from "react";
import TopBar from "./components/layout/TopBar";
import TabNav from "./components/layout/TabNav";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Settings from "./pages/Settings";

const tabs = {
  Dashboard: Dashboard,
  History: History,
  Settings: Settings,
};

function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const ActivePage = tabs[activeTab] ?? Dashboard;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <TopBar />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <TabNav activeTab={activeTab} onChange={setActiveTab} />
      </div>
      <ActivePage />
    </div>
  );
}

export default App;
