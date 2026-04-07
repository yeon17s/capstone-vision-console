import Typography from "../ui/Typography";
import Button from "../ui/Button";

export default function EStopButton() {
  return (
    <Button variant="critical" size="critical">
      <Typography variant="display" tone="inverse">
        E-STOP
      </Typography>
      <Typography variant="controlStrong" tone="inverse" className="mt-2 tracking-[0.26em]">
        Emergency Stop
      </Typography>
    </Button>
  );
}
