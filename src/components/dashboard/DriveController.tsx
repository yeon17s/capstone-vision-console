import { useCallback, useEffect, useRef, useState } from "react";
import Typography from "../ui/Typography";
import MissionPanel from "../ui/MissionPanel";
import Button from "../ui/Button";
import useRobotStore from "../../store/robotStore";
import { publishCmdVel } from "../../lib/rosClient";
import { cancelAutoScan } from "../../lib/autoScanController";

const LINEAR_SPEED  = 0.2;   // m/s
const ANGULAR_SPEED = 0.5;   // rad/s
// ROS는 명령이 끊기면 자동 정지하므로 버튼 홀드 중 지속 전송 필요
const DRIVE_PUBLISH_INTERVAL_MS = 150;
const ESTOP_FEEDBACK_MS = 1600;

const DRIVE_VECTORS: Record<"forward" | "backward" | "left" | "right", { lx: number; az: number }> = {
  forward:  { lx:  LINEAR_SPEED,  az: 0 },
  backward: { lx: -LINEAR_SPEED,  az: 0 },
  left:     { lx: 0, az:  ANGULAR_SPEED },
  right:    { lx: 0, az: -ANGULAR_SPEED },
};

export default function DriveController() {
  const rosConnected = useRobotStore((s) => s.rosConnected);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeDirectionRef = useRef<keyof typeof DRIVE_VECTORS | null>(null);
  const [estopFeedback, setEstopFeedback] = useState<"idle" | "success" | "error">("idle");

  const showEStopFeedback = useCallback((status: "success" | "error") => {
    setEstopFeedback(status);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setEstopFeedback("idle");
      feedbackTimerRef.current = null;
    }, ESTOP_FEEDBACK_MS);
  }, []);

  const stopDriveHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (activeDirectionRef.current) {
      activeDirectionRef.current = null;
      publishCmdVel(0, 0);
    }
  }, []);

  const startDriveHold = useCallback(
    (direction: "forward" | "backward" | "left" | "right") => {
      if (!rosConnected) return;
      // 같은 방향으로 재진입 시 중복 interval 방지
      if (activeDirectionRef.current === direction) return;

      stopDriveHold();
      const { lx, az } = DRIVE_VECTORS[direction];
      const published = publishCmdVel(lx, az);
      if (!published) {
        showEStopFeedback("error");
        return;
      }

      activeDirectionRef.current = direction;
      // 버튼 홀드 중 주기적으로 cmd_vel 재전송 (ROS watchdog 대응)
      holdTimerRef.current = setInterval(() => {
        const stillPublished = publishCmdVel(lx, az);
        if (!stillPublished) {
          stopDriveHold();
          showEStopFeedback("error");
        }
      }, DRIVE_PUBLISH_INTERVAL_MS);
    },
    [rosConnected, showEStopFeedback, stopDriveHold]
  );

  const handleEStop = useCallback(() => {
    cancelAutoScan();
    stopDriveHold();
    const published = publishCmdVel(0, 0);
    showEStopFeedback(published ? "success" : "error");
  }, [showEStopFeedback, stopDriveHold]);

  useEffect(() => {
    // 탭 전환/화면 꺼짐 시 즉시 정지 (숨겨진 탭에서 로봇이 계속 움직이는 것 방지)
    function handleVisibilityChange() {
      if (document.hidden) stopDriveHold();
    }

    // 버튼 영역 밖에서 포인터를 떼어도 정지되도록 전역 이벤트 등록
    window.addEventListener("pointerup", stopDriveHold);
    window.addEventListener("pointercancel", stopDriveHold);
    window.addEventListener("blur", stopDriveHold);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pointerup", stopDriveHold);
      window.removeEventListener("pointercancel", stopDriveHold);
      window.removeEventListener("blur", stopDriveHold);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      stopDriveHold();
    };
  }, [stopDriveHold]);

  useEffect(() => {
    if (!rosConnected) stopDriveHold();
  }, [rosConnected, stopDriveHold]);

  const driveDisabled = !rosConnected;
  const estopStatus =
    estopFeedback === "success"
      ? "STOP SENT"
      : estopFeedback === "error" || !rosConnected
        ? "ROS DISCONNECTED"
        : "READY";

  return (
    <MissionPanel title="Robot Drive" bodyClassName="p-4">
      <div className="flex gap-4">
        {/* Left: Joystick Controls */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center">
            <div className="relative h-64 w-64">
              {/* Center joystick zone */}
              <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-mission-border bg-mission-bg shadow-mission-soft">
                <div className="h-8 w-8 rounded-full border border-mission-text bg-mission-panel" />
              </div>

              {/* Forward */}
              <Button
                variant="icon"
                size="icon"
                onPointerDown={() => startDriveHold("forward")}
                onPointerLeave={stopDriveHold}
                disabled={driveDisabled}
                className="absolute left-1/2 top-0 h-[72px] w-[72px] -translate-x-1/2 touch-none"
              >
                <Typography as="span" variant="display">↑</Typography>
              </Button>

              {/* Backward */}
              <Button
                variant="icon"
                size="icon"
                onPointerDown={() => startDriveHold("backward")}
                onPointerLeave={stopDriveHold}
                disabled={driveDisabled}
                className="absolute bottom-0 left-1/2 h-[72px] w-[72px] -translate-x-1/2 touch-none"
              >
                <Typography as="span" variant="display">↓</Typography>
              </Button>

              {/* Left */}
              <Button
                variant="icon"
                size="icon"
                onPointerDown={() => startDriveHold("left")}
                onPointerLeave={stopDriveHold}
                disabled={driveDisabled}
                className="absolute left-0 top-1/2 h-[72px] w-[72px] -translate-y-1/2 touch-none"
              >
                <Typography as="span" variant="display">←</Typography>
              </Button>

              {/* Right */}
              <Button
                variant="icon"
                size="icon"
                onPointerDown={() => startDriveHold("right")}
                onPointerLeave={stopDriveHold}
                disabled={driveDisabled}
                className="absolute right-0 top-1/2 h-[72px] w-[72px] -translate-y-1/2 touch-none"
              >
                <Typography as="span" variant="display">→</Typography>
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Manual mode status & E-Stop */}
        <div className="flex flex-1 flex-col justify-between gap-4">
          <div className="rounded-lg border border-mission-info bg-mission-info/10 px-3 py-2 text-center">
            <Typography as="span" variant="overline" tone="info" className="font-bold tracking-[0.12em]">
              Manual Mode
            </Typography>
            <Typography as="p" variant="overline" className="mt-0.5 text-mission-text/45">
              Hold to move
            </Typography>
          </div>

          {/* E-Stop Button */}
          <Button
            variant="critical"
            size="critical"
            onClick={handleEStop}
            className={[
              "w-full flex-1 py-0",
              estopFeedback === "success" ? "ring-2 ring-mission-active/60" : "",
              estopFeedback === "error" || !rosConnected ? "ring-2 ring-mission-suspicious/50" : "",
            ].join(" ")}
          >
            <Typography variant="metric" tone="inverse">
              E-STOP
            </Typography>
          </Button>

          <Typography
            as="p"
            variant="overline"
            tone={estopFeedback === "success" ? "success" : estopFeedback === "error" || !rosConnected ? "warning" : "subtle"}
            className="text-center tracking-[0.16em]"
          >
            {estopStatus}
          </Typography>
        </div>
      </div>
    </MissionPanel>
  );
}
