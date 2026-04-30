import { useCallback, useState } from "react";
import * as ROSLIB from "roslib";
import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";
import useRobotStore from "../../store/robotStore";
import useSettingsStore from "../../store/settingsStore";

type DriveMode = "manual" | "auto";

const LINEAR_SPEED  = 0.2;
const ANGULAR_SPEED = 0.5;

const DRIVE_VECTORS: Record<"forward" | "backward" | "left" | "right", { lx: number; az: number }> = {
  forward:  { lx:  LINEAR_SPEED,  az: 0 },
  backward: { lx: -LINEAR_SPEED,  az: 0 },
  left:     { lx: 0, az:  ANGULAR_SPEED },
  right:    { lx: 0, az: -ANGULAR_SPEED },
};

function makeCmdVelTopic(ros: ROSLIB.Ros) {
  return new ROSLIB.Topic({
    ros,
    name: "/cmd_vel",
    messageType: "geometry_msgs/Twist",
  });
}

function publishVelocity(ros: ROSLIB.Ros, lx: number, az: number) {
  const topic = makeCmdVelTopic(ros);
  topic.publish({ linear: { x: lx, y: 0, z: 0 }, angular: { x: 0, y: 0, z: az } } as any);
}

function createRos() {
  const { jetsonIp, rosbridgePort } = useSettingsStore.getState();
  return new ROSLIB.Ros({ url: `ws://${jetsonIp}:${rosbridgePort}` });
}

export default function DriveController() {
  const { driveMode, setDriveMode, rosConnected } = useRobotStore();
  const [localMode, setLocalMode] = useState<DriveMode>(driveMode);

  const handleModeChange = (mode: DriveMode) => {
    setLocalMode(mode);
    setDriveMode(mode);
  };

  const handleDriveCommand = useCallback(
    (direction: "forward" | "backward" | "left" | "right") => {
      if (!rosConnected) return;
      const { lx, az } = DRIVE_VECTORS[direction];
      const ros = createRos();
      publishVelocity(ros, lx, az);
    },
    [rosConnected]
  );

  const handleEStop = useCallback(() => {
    const ros = createRos();
    publishVelocity(ros, 0, 0);
  }, []);

  return (
    <MissionPanel title="Robot Drive" bodyClassName="p-5" borderTone="mvp">
      <div className="flex gap-6">
        {/* Left: Joystick Controls */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center">
            <div className="relative h-48 w-48">
              {/* Center joystick zone */}
              <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-mission-border bg-mission-bg shadow-mission-soft">
                <div className="h-8 w-8 rounded-full border border-mission-text bg-mission-panel" />
              </div>

              {/* Forward */}
              <Button
                variant="icon"
                size="icon"
                onClick={() => handleDriveCommand("forward")}
                className="absolute left-1/2 top-0 -translate-x-1/2 h-14 w-14"
              >
                <Typography as="span" variant="metric">↑</Typography>
              </Button>

              {/* Backward */}
              <Button
                variant="icon"
                size="icon"
                onClick={() => handleDriveCommand("backward")}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-14 w-14"
              >
                <Typography as="span" variant="metric">↓</Typography>
              </Button>

              {/* Left */}
              <Button
                variant="icon"
                size="icon"
                onClick={() => handleDriveCommand("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 h-14 w-14"
              >
                <Typography as="span" variant="metric">←</Typography>
              </Button>

              {/* Right */}
              <Button
                variant="icon"
                size="icon"
                onClick={() => handleDriveCommand("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 h-14 w-14"
              >
                <Typography as="span" variant="metric">→</Typography>
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Mode Control & E-Stop (vertical stack) */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Drive Mode Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={localMode === "auto" ? "panel" : "panel"}
              size="md"
              className={`py-3 ${localMode === "auto" ? "border border-mission-border" : ""}`}
              onClick={() => handleModeChange("auto")}
            >
              <Typography
                as="span"
                variant="controlStrong"
                tone={localMode === "auto" ? undefined : undefined}
                className="tracking-[0.12em]"
              >
                Auto<br />Patrol
              </Typography>
            </Button>
            <Button
              variant={localMode === "manual" ? "primary" : "panel"}
              size="md"
              className="py-3"
              onClick={() => handleModeChange("manual")}
            >
              <Typography
                as="span"
                variant="controlStrong"
                tone={localMode === "manual" ? "inverse" : undefined}
                className="tracking-[0.12em]"
              >
                Manual<br />Mode
              </Typography>
            </Button>
          </div>

          {/* E-Stop Button */}
          <Button variant="critical" size="critical" onClick={handleEStop} className="w-full py-4">
            <Typography variant="display" tone="inverse">
              E-STOP
            </Typography>
            <Typography variant="controlStrong" tone="inverse" className="mt-2 tracking-[0.26em]">
              Emergency Stop
            </Typography>
          </Button>
        </div>
      </div>
    </MissionPanel>
  );
}
