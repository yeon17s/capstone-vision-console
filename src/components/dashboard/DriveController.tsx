import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";

export default function DriveController() {
  return (
    <MissionPanel title="Robot Drive" bodyClassName="px-5 py-4" borderTone="mvp">
        {/* D-pad + joystick */}
        <div className="flex items-center justify-center">
          <div className="relative h-40 w-40">
            {/* Joystick zone */}
            <div
              id="joystick-zone"
              className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-mission-border bg-mission-bg shadow-mission-soft"
            >
              <div className="h-7 w-7 rounded-full border border-mission-text bg-mission-panel" />
            </div>

            {/* Up */}
            <Button variant="icon" size="icon" className="absolute left-1/2 top-0 -translate-x-1/2"><Typography as="span" variant="metric">↑</Typography></Button>
            {/* Down */}
            <Button variant="icon" size="icon" className="absolute bottom-0 left-1/2 -translate-x-1/2"><Typography as="span" variant="metric">↓</Typography></Button>
            {/* Left */}
            <Button variant="icon" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2"><Typography as="span" variant="metric">←</Typography></Button>
            {/* Right */}
            <Button variant="icon" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2"><Typography as="span" variant="metric">→</Typography></Button>
          </div>
        </div>
    </MissionPanel>
  );
}
