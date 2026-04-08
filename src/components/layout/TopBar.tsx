import Typography from "../ui/Typography";
import Button from "../ui/Button";
import StatusIndicator from "../ui/StatusIndicator";

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

function getPingBadgeTone(pingMs: number): "success" | "warning" | "danger" {
  if (pingMs <= 40) return "success";
  if (pingMs <= 90) return "warning";
  return "danger";
}

export default function TopBar({ activeTab, onTabChange }: TopBarProps) {
  const pingMs = 32;
  const pingToneClass = getPingTone(pingMs);
  const pingBadgeTone = getPingBadgeTone(pingMs);

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-mission-border bg-mission-bg px-6 py-3">
      <div className="flex items-center gap-8">
        {/* Branding */}
        <div className="flex min-w-[100px] items-center gap-3">
          <Typography as="span" variant="brand">
            RCOD
          </Typography>
          <span className="text-mission-border">|</span>
          <Typography as="span" variant="overline" className="tracking-[0.32em]">
            Mission Console
          </Typography>
        </div>

        {/* Top Navigation */}
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
      </div>

      {/* Status Widgets */}
      <div className="flex min-w-[500px] items-center justify-end gap-3 rounded-[18px] border border-[var(--color-accent-yellow)] p-1">
        <div className="rounded-lg border border-mission-border bg-mission-panel px-3 py-2">
          <Typography as="span" variant="monoStrong">○</Typography>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-mission-border bg-mission-panel px-4 py-2">
          <div className="flex gap-3">
            <StatusIndicator tone="success" label="ROS" size="md" className="tracking-[0.16em]" />
            <StatusIndicator tone="success" label="FastAPI" size="md" className="tracking-[0.16em]" />
            <StatusIndicator tone="danger" label="Camera" size="md" className="tracking-[0.16em]" />
          </div>
        </div>

        <div className="rounded-lg border border-mission-border bg-mission-panel px-4 py-2">
          <Typography as="span" variant="controlStrong" className="tracking-[0.18em]">Ping:</Typography>{" "}
          <StatusIndicator
            tone={pingBadgeTone}
            label={`${pingMs}ms`}
            showDot={false}
            textVariant="monoStrong"
            className={pingToneClass}
          />
        </div>

        <div className="rounded-lg border border-mission-border bg-mission-panel px-4 py-2">
          <Typography as="span" variant="controlStrong" className="tracking-[0.18em]">Battery:</Typography>{" "}
          <Typography as="span" variant="monoStrong" tone="success">85%</Typography>
        </div>
      </div>
    </header>
  );
}
