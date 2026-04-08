import Typography from "../ui/Typography";
import Button from "../ui/Button";

export default function EStopButton() {
  return (
    <div className="rounded-[18px] border border-[var(--color-accent-yellow)] p-1">
      <Button variant="critical" size="critical">
        <Typography variant="display" tone="inverse">
          E-STOP
        </Typography>
        <Typography variant="controlStrong" tone="inverse" className="mt-2 tracking-[0.26em]">
          Emergency Stop
        </Typography>
      </Button>
    </div>
  );
}
