import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";

interface StatusCellProps {
  label: string;
  value: string;
  valueClass?: string;
}

function getFrameDelayTone(frameDelayMs: number): string {
  if (frameDelayMs <= 60) return "text-mission-active";
  if (frameDelayMs <= 120) return "text-mission-suspicious";
  return "text-mission-critical";
}

function StatusCell({ label, value, valueClass = "text-mission-text" }: StatusCellProps) {
  return (
    <div className="flex min-h-[88px] flex-col items-center justify-center gap-1 px-3 py-3">
      <Typography variant="overline" className="tracking-[0.14em]">{label}</Typography>
      <Typography variant="metric" className={`uppercase ${valueClass}`}>{value}</Typography>
    </div>
  );
}

export default function AIStatusPanel() {
  const frameDelayMs = 48;
  const frameDelayToneClass = getFrameDelayTone(frameDelayMs);

  return (
    <MissionPanel
      className="shrink-0"
      compactBody
      bodyClassName="p-0"
      footer={
        <Typography variant="overline" as="p" className="text-center font-bold tracking-[0.32em]">
          AI Detection Status Panel
        </Typography>
      }
    >
      <div className="grid grid-cols-6 divide-x divide-mission-border">
        {/* Last Detected */}
        <StatusCell label="Last Detected" value="person" valueClass="text-mission-text" />

        {/* Confidence */}
        <StatusCell label="Confidence" value="98.5%" valueClass="text-mission-active" />

        {/* Current Mode */}
        <StatusCell label="Current Mode" value="Manual" valueClass="text-mission-info" />

        {/* Frame Delay + FPS */}
        <div className="flex min-h-[88px] flex-col items-center justify-center gap-1 px-3 py-3">
          <Typography variant="overline" className="tracking-[0.14em]">Frame Delay</Typography>
          <Typography variant="metric" className={frameDelayToneClass}>{frameDelayMs}ms</Typography>
          <Typography variant="monoStrong" className="uppercase tracking-[0.12em]">FPS: 20.5</Typography>
        </div>

        {/* Freeze Frame */}
        <div className="flex min-h-[88px] flex-col items-center justify-center gap-1.5 px-3 py-3">
          <Typography variant="overline" className="tracking-[0.14em]">Freeze Frame</Typography>
          <Button variant="panel" size="sm">
            <Typography as="span" variant="controlStrong" className="tracking-[0.12em]">FREEZE</Typography>
          </Button>
        </div>

        {/* Visual Mode */}
        <div className="flex min-h-[88px] flex-col items-center justify-center gap-1 px-3 py-3">
          <Typography variant="overline" className="tracking-[0.14em]">Visual Mode</Typography>
          <div className="rounded-md border border-mission-border bg-mission-bg px-3 py-1">
            <Typography variant="metric">RGB</Typography>
          </div>
        </div>
      </div>
    </MissionPanel>
  );
}
