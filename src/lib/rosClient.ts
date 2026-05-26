import * as ROSLIB from "roslib";

interface TwistMsg {
  linear:  { x: number; y: number; z: number };
  angular: { x: number; y: number; z: number };
}

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
  // ROS 미연결 상태면 false 반환 (DriveController에서 E-Stop 피드백에 사용)
  if (!ros) return false;

  // Topic은 연결 후 최초 호출 시 lazy 생성 (setRos(null) 시 캐시 초기화됨)
  if (!cmdVelTopic) {
    cmdVelTopic = new ROSLIB.Topic({
      ros,
      name: "/cmd_vel",
      messageType: "geometry_msgs/Twist",
    });
  }

  const msg: TwistMsg = {
    linear:  { x: lx, y: 0, z: 0 },
    angular: { x: 0,  y: 0, z: az },
  };
  cmdVelTopic.publish(msg as unknown as object);

  return true;
}
