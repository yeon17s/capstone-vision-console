import * as ROSLIB from "roslib";
import { useEffect } from "react";
import useRobotStore from "../store/robotStore";
import useSettingsStore from "../store/settingsStore";
import { setRos } from "../lib/rosClient";

//batterySub.subscribe 부분 수정 (배터리 로직 세분화)


interface BatteryStateMsg {
  percentage: number;
  voltage: number;
}

interface AmclPoseMsg {
  pose: {
    pose: {
      position: { x: number; y: number; z: number };
      orientation: { x: number; y: number; z: number; w: number };
    };
  };
}

const RECONNECT_DELAY_MS = 3000;

export default function useRosConnection() {
  const jetsonIp      = useSettingsStore((s) => s.jetsonIp);
  const rosbridgePort = useSettingsStore((s) => s.rosbridgePort);

  useEffect(() => {
    const { setConnectionStatus, setBatteryPercent, setPose } = useRobotStore.getState();

    let ros: ROSLIB.Ros;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    // 외부 스코프에서 subscriber를 관리해 reconnect 시 unsubscribe 가능하게 함
    let batterySub: ROSLIB.Topic | null = null;
    let poseSub: ROSLIB.Topic | null = null;

    function unsubscribeAll() {
      batterySub?.unsubscribe();
      poseSub?.unsubscribe();
      batterySub = null;
      poseSub = null;
    }

    function connect() {
      ros = new ROSLIB.Ros({ url: `ws://${jetsonIp}:${rosbridgePort}` });
      setRos(ros);

      ros.on("connection", () => {
        setConnectionStatus("rosConnected", true);

        batterySub = new ROSLIB.Topic({
          ros,
          name: "/battery_state",
          messageType: "sensor_msgs/BatteryState",
        });
        batterySub.subscribe((msg) => {
          const { voltage } = msg as BatteryStateMsg;
          let percent = 0;

          if (voltage >= 12.5) percent = 100;
          else if (voltage >= 12.0) percent = 80;
          else if (voltage >= 11.4) percent = 50;
          else if (voltage >= 11.1) percent = 20;
          else if (voltage >= 10.5) percent = 5;
          else percent = 0;

          setBatteryPercent(percent);
        });

        poseSub = new ROSLIB.Topic({
          ros,
          name: "/amcl_pose",
          messageType: "geometry_msgs/PoseWithCovarianceStamped",
        });
        poseSub.subscribe((msg) => {
          const { x, y } = (msg as AmclPoseMsg).pose.pose.position;
          const { z, w } = (msg as AmclPoseMsg).pose.pose.orientation;
          setPose({ x, y, yaw: 2 * Math.atan2(z, w) });
        });
      });

      ros.on("error", () => {
        setConnectionStatus("rosConnected", false);
      });

      ros.on("close", () => {
        unsubscribeAll();
        setConnectionStatus("rosConnected", false);
        setRos(null);
        if (!destroyed) {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      });
    }

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      unsubscribeAll();
      ros?.close();
      setRos(null);
      setConnectionStatus("rosConnected", false);
    };
  }, [jetsonIp, rosbridgePort]);
}
