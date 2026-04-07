import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";

type Direction = "up" | "left" | "center" | "right" | "down";

interface DPadButton {
  label: string;
  pos: string;
  dir: Direction;
  isCenter?: boolean;
}

const DPAD_BUTTONS: DPadButton[] = [
  { label: "↑", pos: "col-start-2 row-start-1", dir: "up" },
  { label: "←", pos: "col-start-1 row-start-2", dir: "left" },
  { label: "●", pos: "col-start-2 row-start-2", dir: "center", isCenter: true },
  { label: "→", pos: "col-start-3 row-start-2", dir: "right" },
  { label: "↓", pos: "col-start-2 row-start-3", dir: "down" },
];

export default function PanTiltController() {
  return (
    <MissionPanel title="Camera Pan / Tilt" bodyClassName="px-5 py-4">
      <div className="flex items-center justify-center">
        <div className="grid grid-cols-3 grid-rows-3 gap-1.5">
          {DPAD_BUTTONS.map(({ label, pos, dir, isCenter }) => (
            <Button
              key={dir}
              variant={isCenter ? "iconMuted" : "icon"}
              size="icon"
              className={`${pos} ${
                isCenter
                  ? "cursor-default"
                  : ""
              }`}
              disabled={isCenter}
            >
              <Typography as="span" variant="metric">{label}</Typography>
            </Button>
          ))}
        </div>
      </div>
    </MissionPanel>
  );
}
