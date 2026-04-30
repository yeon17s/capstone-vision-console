import * as ROSLIB from "roslib";

let rosInstance: ROSLIB.Ros | null = null;
let cmdVelTopic: ROSLIB.Topic | null = null;

export function getRos(): ROSLIB.Ros | null {
  return rosInstance;
}

export function setRos(instance: ROSLIB.Ros | null): void {
  rosInstance = instance;
  // ROS 인스턴스가 교체/해제되면 캐시된 topic도 무효화
  cmdVelTopic = null;
}

export function publishCmdVel(lx: number, az: number): boolean {
  const ros = rosInstance;
  if (!ros) return false;

  if (!cmdVelTopic) {
    cmdVelTopic = new ROSLIB.Topic({
      ros,
      name: "/cmd_vel",
      messageType: "geometry_msgs/Twist",
    });
  }

  cmdVelTopic.publish({
    linear:  { x: lx, y: 0, z: 0 },
    angular: { x: 0,  y: 0, z: az },
  } as any);

  return true;
}
