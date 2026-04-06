type TabName = "Dashboard" | "History" | "Settings";

const TABS: TabName[] = ["Dashboard", "History", "Settings"];

interface TopBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

function getPingTone(pingMs: number): string {
  if (pingMs <= 40) return "text-mission-active";
  if (pingMs <= 90) return "text-mission-suspicious";
  return "text-mission-critical";
}

export default function TopBar({ activeTab, onTabChange }: TopBarProps) {
  const pingMs = 32;
  const pingToneClass = getPingTone(pingMs);

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-mission-border bg-mission-bg px-6 py-3">
      {/* Branding */}
      <div className="flex min-w-[200px] items-center gap-3">
        <span className="text-[13px] font-black uppercase tracking-[0.28em] text-mission-text">
          RCOD
        </span>
        <span className="text-mission-border">|</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-mission-text">
          Mission Console
        </span>
      </div>

      {/* Tab Navigation — centered */}
      <nav className="flex gap-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`min-w-[152px] rounded-lg border px-6 py-2.5 text-[12px] font-bold uppercase tracking-[0.22em] transition ${
              activeTab === tab
                ? "border-mission-info bg-mission-info text-mission-bg shadow-mission-glow-blue"
                : "border-mission-border bg-mission-panel text-mission-text hover:border-mission-text hover:bg-mission-panel hover:text-mission-text"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Status Widgets */}
      <div className="flex min-w-[700px] items-center justify-end gap-3">
        <div className="rounded-lg border border-mission-border bg-mission-panel px-3 py-2 text-[11px] text-mission-text">
          ○
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-mission-border bg-mission-panel px-4 py-2 text-[11px]">
          <div className="flex gap-3">
            <span className="flex items-center gap-1.5 uppercase tracking-[0.16em] text-mission-active">
              <span className="h-2 w-2 rounded-full bg-mission-active shadow-mission-glow-green" />
              ROS
            </span>
            <span className="flex items-center gap-1.5 uppercase tracking-[0.16em] text-mission-active">
              <span className="h-2 w-2 rounded-full bg-mission-active shadow-mission-glow-green" />
              FastAPI
            </span>
            <span className="flex items-center gap-1.5 uppercase tracking-[0.16em] text-mission-critical">
              <span className="h-2 w-2 rounded-full bg-mission-critical shadow-mission-glow-red" />
              Camera
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-mission-border bg-mission-panel px-4 py-2 text-[12px]">
          <span className="uppercase tracking-[0.18em] text-mission-text">Ping:</span>{" "}
          <span className={`font-mono font-bold ${pingToneClass}`}>{pingMs}ms</span>
        </div>

        <div className="rounded-lg border border-mission-border bg-mission-panel px-4 py-2 text-[12px]">
          <span className="uppercase tracking-[0.18em] text-mission-text">Battery:</span>{" "}
          <span className="font-mono font-bold text-mission-active">85%</span>
        </div>
      </div>
    </header>
  );
}
