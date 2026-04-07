import Typography from "../ui/Typography";
import Button from "../ui/Button";

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
        <Typography as="span" variant="brand">
          RCOD
        </Typography>
        <span className="text-mission-border">|</span>
        <Typography as="span" variant="overline" className="tracking-[0.32em]">
          Mission Console
        </Typography>
      </div>

      {/* Tab Navigation — centered */}
      <nav className="flex gap-3">
        {TABS.map((tab) => (
          <Button
            key={tab}
            onClick={() => onTabChange(tab)}
            variant="nav"
            size="lg"
            active={activeTab === tab}
            className="min-w-[152px]"
          >
            <Typography as="span" variant="controlStrong" className={activeTab === tab ? "text-mission-bg" : ""}>
              {tab}
            </Typography>
          </Button>
        ))}
      </nav>

      {/* Status Widgets */}
      <div className="flex min-w-[700px] items-center justify-end gap-3">
        <div className="rounded-lg border border-mission-border bg-mission-panel px-3 py-2">
          <Typography as="span" variant="monoStrong">○</Typography>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-mission-border bg-mission-panel px-4 py-2">
          <div className="flex gap-3">
            <Typography as="span" variant="overline" tone="success" className="flex items-center gap-1.5 tracking-[0.16em]">
              <span className="h-2 w-2 rounded-full bg-mission-active shadow-mission-glow-green" />
              ROS
            </Typography>
            <Typography as="span" variant="overline" tone="success" className="flex items-center gap-1.5 tracking-[0.16em]">
              <span className="h-2 w-2 rounded-full bg-mission-active shadow-mission-glow-green" />
              FastAPI
            </Typography>
            <Typography as="span" variant="overline" tone="danger" className="flex items-center gap-1.5 tracking-[0.16em]">
              <span className="h-2 w-2 rounded-full bg-mission-critical shadow-mission-glow-red" />
              Camera
            </Typography>
          </div>
        </div>

        <div className="rounded-lg border border-mission-border bg-mission-panel px-4 py-2">
          <Typography as="span" variant="controlStrong" className="tracking-[0.18em]">Ping:</Typography>{" "}
          <Typography as="span" variant="monoStrong" className={pingToneClass}>{pingMs}ms</Typography>
        </div>

        <div className="rounded-lg border border-mission-border bg-mission-panel px-4 py-2">
          <Typography as="span" variant="controlStrong" className="tracking-[0.18em]">Battery:</Typography>{" "}
          <Typography as="span" variant="monoStrong" tone="success">85%</Typography>
        </div>
      </div>
    </header>
  );
}
