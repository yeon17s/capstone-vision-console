# 구현 점검 리스트 (Implementation Checklist)

현재 구현 상태 기준으로 **실제 미구현 항목만** 정리합니다.  
빌드는 통과하지만 ROS 통신 레이어가 전혀 없는 상태입니다.

---

## ✅ 이미 완료된 항목 (수정 불필요)

| 파일 | 상태 |
|------|------|
| `useAIStream.ts` | AI WebSocket 완전 구현 (재연결, throttle, snapshot 캡처 포함) |
| `robotStore.ts` | 모든 상태 및 setter 완전 구현 |
| `settingsStore.ts` | localStorage 영속화 및 migration 완전 구현 |
| `AIStatusPanel.tsx` | 실시간 detection 데이터 연결 완료 |
| `AIOverlay.tsx` | bbox 동적 위치 계산 및 ResizeObserver 완료 |
| `AlertFeed.tsx` | detectionLog 실시간 연결 완료 |
| `CriticalAlarmOverlay.tsx` | confidence ≥ threshold 조건 로직 완료 |
| `VideoStream.tsx` | spacebar 토글, freeze-frame 캡처 완료 |
| `Dashboard.tsx` | 전체 레이아웃 및 컴포넌트 통합 완료 |
| `DetailModal.tsx` | 이미지 비교, confidence donut, frame delay 기준 완료 |
| `DiagnosticsMonitor.tsx` | robotStore 연결 상태 표시 완료 |
| `ConnectionForm.tsx` | settingsStore 연결 및 저장 완료 |
| `App.tsx` | useAIStream mount, capture callback 연결 완료 |

---

## 🔴 미구현 — ROS 통신 레이어

### 1. roslibjs 패키지 설치
**현재**: 미설치  
**필요**:
```bash
npm install roslib
npm install --save-dev @types/roslib
```
**이유**: 이하 모든 ROS 항목의 전제 조건

---

### 2. useRosConnection.ts — ROS Bridge 연결 구현
**파일**: `src/hooks/useRosConnection.ts`  
**현재**: 완전히 빈 stub (return () => {} 만 존재)  
**필요**:

```typescript
import ROSLIB from "roslib";
import { useEffect, useRef } from "react";
import useRobotStore from "../store/robotStore";
import useSettingsStore from "../store/settingsStore";

export default function useRosConnection() {
  const rosRef = useRef<ROSLIB.Ros | null>(null);
  const { jetsonIp, rosbridgePort } = useSettingsStore.getState();
  const { setConnectionStatus, setBattery, setPose } = useRobotStore.getState();

  useEffect(() => {
    const ros = new ROSLIB.Ros({
      url: `ws://${jetsonIp}:${rosbridgePort}`,
    });
    rosRef.current = ros;

    ros.on("connection", () => setConnectionStatus("rosConnected", true));
    ros.on("error",      () => setConnectionStatus("rosConnected", false));
    ros.on("close",      () => setConnectionStatus("rosConnected", false));

    // /battery_state subscriber
    const batterySub = new ROSLIB.Topic({
      ros,
      name: "/battery_state",
      messageType: "sensor_msgs/BatteryState",
    });
    batterySub.subscribe((msg: any) => {
      setBattery(Math.round(msg.percentage * 100));
    });

    // /amcl_pose subscriber
    const poseSub = new ROSLIB.Topic({
      ros,
      name: "/amcl_pose",
      messageType: "geometry_msgs/PoseWithCovarianceStamped",
    });
    poseSub.subscribe((msg: any) => {
      const { x, y } = msg.pose.pose.position;
      const { z, w } = msg.pose.pose.orientation;
      setPose({ x, y, theta: 2 * Math.atan2(z, w) });
    });

    return () => {
      batterySub.unsubscribe();
      poseSub.unsubscribe();
      ros.close();
    };
  }, [jetsonIp, rosbridgePort]);

  return rosRef;
}
```

**영향**: rosConnected 상태, 배터리, 로봇 위치 전부 미동작

---

### 3. App.tsx — useRosConnection mount 추가
**파일**: `src/App.tsx`  
**현재**: `useAIStream`만 mount, `useRosConnection`은 호출 안 됨  
**필요**: 
```typescript
import useRosConnection from "./hooks/useRosConnection";

// App 컴포넌트 내부에 추가
useRosConnection();
```

---

### 4. DriveController.tsx — /cmd_vel publish 구현
**파일**: `src/components/dashboard/DriveController.tsx`  
**현재**: `handleDriveCommand`, `handleEStop` 모두 `console.log`만  
**필요**:

```typescript
// useRosConnection에서 반환한 rosRef를 props 또는 context로 전달받거나
// 별도 useCmdVel 훅으로 분리

const publishCmdVel = (linear: number, angular: number) => {
  const cmdVel = new ROSLIB.Topic({
    ros: rosRef.current!,
    name: "/cmd_vel",
    messageType: "geometry_msgs/Twist",
  });
  cmdVel.publish(new ROSLIB.Message({
    linear:  { x: linear,  y: 0, z: 0 },
    angular: { x: 0, y: 0, z: angular },
  }));
};

// 방향별 매핑 (스펙 기준)
// forward:  linear.x = 0.2, angular.z = 0
// backward: linear.x = -0.2, angular.z = 0
// left:     linear.x = 0,   angular.z = 0.5
// right:    linear.x = 0,   angular.z = -0.5
// E-stop:   linear.x = 0,   angular.z = 0 (즉시 한 번만 publish)
```

**E-stop 우선순위**: 모드/방향 상관없이 즉시 zero-velocity publish

---

### 5. MiniMap.tsx — ROS /map + /amcl_pose 연결
**파일**: `src/components/dashboard/MiniMap.tsx`  
**현재**: 텍스트 placeholder만 표시  
**필요**:
- `/map` 토픽 (`nav_msgs/OccupancyGrid`) subscribe → Canvas에 occupancy grid 렌더링
- `/amcl_pose` 위치를 map 좌표계에서 픽셀 좌표로 변환하여 로봇 마커 표시
- detection 이벤트 시 마커 추가 (선택, MVP 이후 가능)

**구현 방식 옵션**:
- `ros2djs` 라이브러리 사용 (CDN 또는 npm)
- 또는 Canvas API로 직접 렌더링 (`OccupancyGrid.data` 배열 → ImageData)

**주의**: `/map` 메시지는 수백 KB 이상일 수 있어 subscribe 빈도 조절 필요 (throttle)

---

## 🟡 추가 검토 항목

### 6. DiagnosticsMonitor.tsx — FastAPI /ping 헬스체크
**파일**: `src/components/settings/DiagnosticsMonitor.tsx`  
**현재**: robotStore의 boolean 상태만 표시 (AI/ROS/Camera)  
**필요**: FastAPI `GET /ping` 주기적 호출로 백엔드 연결 상태 별도 확인

```typescript
useEffect(() => {
  const check = async () => {
    try {
      const res = await fetch(`${fastapiUrl}/ping`, { signal: AbortSignal.timeout(3000) });
      setConnectionStatus("fastapiConnected", res.ok);
    } catch {
      setConnectionStatus("fastapiConnected", false);
    }
  };
  check();
  const id = setInterval(check, 10_000);
  return () => clearInterval(id);
}, [fastapiUrl]);
```

**참고**: `robotStore`에 `fastapiConnected` 필드 추가 필요

---

### 7. VideoStream.tsx — 스트림 URL을 settingsStore에서 읽기
**파일**: `src/components/dashboard/VideoStream.tsx`  
**현재**: `http://192.168.0.45:8080/stream` 하드코딩  
**필요**: 
```typescript
const { jetsonIp } = useSettingsStore();
const streamUrl = `http://${jetsonIp}:8080/stream?topic=/cv_camera/image_raw`;
```
**이유**: ConnectionForm에서 IP를 바꿔도 스트림이 안 바뀜

---

### 8. useRosConnection.ts — jetsonIp/port 변경 시 재연결
**파일**: `src/hooks/useRosConnection.ts`  
**현재**: (아직 미구현이라 해당 없음)  
**구현 시 주의**: ConnectionForm에서 IP 변경 → Save 후 ROS 재연결이 트리거되어야 함  
settingsStore를 subscribe하거나 useEffect dependency에 포함

---

## 📊 우선순위 요약

| 우선순위 | 항목 | 파일 | 복잡도 |
|---------|------|------|--------|
| 🔴 즉시 | roslibjs 설치 | package.json | 낮음 |
| 🔴 즉시 | useRosConnection 구현 | useRosConnection.ts | 중간 |
| 🔴 즉시 | App.tsx에 mount 추가 | App.tsx | 낮음 |
| 🔴 높음 | DriveController /cmd_vel publish | DriveController.tsx | 중간 |
| 🟡 중간 | MiniMap ROS 연결 | MiniMap.tsx | 높음 |
| 🟡 중간 | DiagnosticsMonitor FastAPI ping | DiagnosticsMonitor.tsx | 낮음 |
| 🟡 중간 | VideoStream URL 동적 처리 | VideoStream.tsx | 낮음 |

---

## 📝 권장 작업 순서

1. `npm install roslib @types/roslib`
2. **useRosConnection 구현** → rosConnected, battery, pose 데이터 흐름 확보
3. **App.tsx mount** → ROS 연결 시작
4. **DriveController /cmd_vel** → 수동 제어 가능
5. **VideoStream URL 동적화** → IP 변경 반영
6. **DiagnosticsMonitor FastAPI ping** → 전체 상태 모니터링 완성
7. **MiniMap** → 지도 시각화 (가장 복잡, 마지막 구현)

---

## 📌 참고 문서

- `docs/specs/API_DETAILS.md` — ROS 토픽, 엔드포인트, 드라이브 속도값
- `docs/AGENTS.md` — 전체 규칙 및 상태 계약
