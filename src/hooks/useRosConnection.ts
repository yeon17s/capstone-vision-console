import * as ROSLIB from "roslib";
import { useEffect } from "react";
import useRobotStore from "../store/robotStore";
import useSettingsStore from "../store/settingsStore";
import { setRos } from "../lib/rosClient";

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
        batterySub.subscribe((msg: any) => {
          setBatteryPercent(Math.round(msg.percentage * 100));
        });

        poseSub = new ROSLIB.Topic({
          ros,
          name: "/amcl_pose",
          messageType: "geometry_msgs/PoseWithCovarianceStamped",
        });
        poseSub.subscribe((msg: any) => {
          const { x, y } = msg.pose.pose.position;
          const { z, w } = msg.pose.pose.orientation;
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
