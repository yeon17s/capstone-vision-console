import * as ROSLIB from "roslib";
import { useEffect, useRef } from "react";
import useRobotStore from "../store/robotStore";
import useSettingsStore from "../store/settingsStore";

export default function useRosConnection() {
  const rosRef = useRef<ROSLIB.Ros | null>(null);

  useEffect(() => {
    const { jetsonIp, rosbridgePort } = useSettingsStore.getState();
    const { setConnectionStatus, setBatteryPercent, setPose } = useRobotStore.getState();

    const ros = new ROSLIB.Ros({ url: `ws://${jetsonIp}:${rosbridgePort}` });
    rosRef.current = ros;

    ros.on("connection", () => setConnectionStatus("rosConnected", true));
    ros.on("error",      () => setConnectionStatus("rosConnected", false));
    ros.on("close",      () => setConnectionStatus("rosConnected", false));

    const batterySub = new ROSLIB.Topic({
      ros,
      name: "/battery_state",
      messageType: "sensor_msgs/BatteryState",
    });
    batterySub.subscribe((msg: any) => {
      setBatteryPercent(Math.round(msg.percentage * 100));
    });

    const poseSub = new ROSLIB.Topic({
      ros,
      name: "/amcl_pose",
      messageType: "geometry_msgs/PoseWithCovarianceStamped",
    });
    poseSub.subscribe((msg: any) => {
      const { x, y } = msg.pose.pose.position;
      const { z, w } = msg.pose.pose.orientation;
      setPose({ x, y, yaw: 2 * Math.atan2(z, w) });
    });

    return () => {
      batterySub.unsubscribe();
      poseSub.unsubscribe();
      ros.close();
    };
  }, []);

  return rosRef;
}
