import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";

export default function DriveModeControl() {
  return (
    <MissionPanel title="Drive Mode" bodyClassName="px-5 py-4">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="panel" size="md" className="py-3">
            <Typography as="span" variant="controlStrong" className="tracking-[0.12em]">Auto Patrol</Typography>
          </Button>
          <Button variant="primary" size="md" className="py-3">
            <Typography as="span" variant="controlStrong" tone="inverse" className="tracking-[0.12em]">Manual Mode</Typography>
          </Button>
        </div>
    </MissionPanel>
  );
}
