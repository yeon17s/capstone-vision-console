# 구현 점검 리스트 (Implementation Checklist)

현재 워크트리 기준 코드 리뷰 결과입니다.

- `npm run build`: 통과
- `npx tsc -b`: 실패 (`src/main.tsx`의 `./index.css` side-effect import 타입 선언 누락)
- ROS/AI/카메라 연동 코드는 일부 구현되었지만, 실제 운영 안정성 관점에서는 추가 수정이 필요합니다.

---

## 현재 상태 요약

| 영역 | 현재 상태 | 판정 |
|------|----------|------|
| AI WebSocket | `useAIStream` mount, 재연결, 3초 throttle, snapshot 캡처 구현 | 보완 필요 |
| Camera stream | settings IP 기반 MJPEG URL, `cameraConnected` onLoad/onError 반영 | 보완 필요 |
| ROS bridge | `useRosConnection` mount, reconnect, battery/pose subscribe 구현 | 보완 필요 |
| Drive control | 공유 ROS 인스턴스 사용, `/cmd_vel` publish, E-stop 구현 | 보완 필요 |
| Dashboard overlay | `object-cover` crop 기준 bbox 계산 구현 | 검증 필요 |
| History | detectionLog 연결, confidence 0-100 반영 | 보완 필요 |
| Settings | localStorage persistence, confidence migration 구현 | 대체로 완료 |
| TopBar/Diagnostics | store 기반 상태 표시 일부 구현 | 보완 필요 |
| MiniMap | placeholder | 미구현 |

---

## 완료로 볼 수 있는 항목

| 파일 | 확인 내용 |
|------|----------|
| `App.tsx` | `useAIStream`, `useRosConnection` mount 완료 |
| `settingsStore.ts` | `confidenceThreshold` 0-1 -> 0-100 migration 포함 |
| `VideoStream.tsx` | `jetsonIp` 기반 stream URL, visual mode toggle, camera status 이벤트 연결 |
| `useVideoCapture.ts` | CORS/canvas 실패 시 `undefined` 반환하도록 방어 |
| `AIStatusPanel.tsx` | detection, driveMode, visual mode 표시 연결 |
| `AlertFeed.tsx` | mock 제거, `detectionLog` 기반 카드 렌더링 |
| `CriticalAlarmOverlay.tsx` | `person` + threshold 조건으로 표시 |
| `DetectionTable.tsx` | confidence 0-100 표시 기준 반영 |
| `DetailModal.tsx` | false positive 버튼, snapshot 비교, frame delay 기준 반영 |

---

## 🔴 High: 우선 수정 필요

### 1. `DriveController.tsx` - `/cmd_vel` Topic을 매 클릭마다 생성

**파일**: `src/components/dashboard/DriveController.tsx`

**현재**
```ts
function publishCmdVel(lx: number, az: number): boolean {
  const ros = getRos();
  if (!ros) return false;
  const topic = new ROSLIB.Topic({ ros, name: "/cmd_vel", messageType: "geometry_msgs/Twist" });
  topic.publish(...);
  return true;
}
```

**문제**
- 클릭마다 `ROSLIB.Topic`이 새로 생성됩니다.
- 짧은 반복 입력에서 불필요한 객체 생성이 늘어납니다.
- publish 실패 여부가 UI에 반영되지 않습니다.

**권장**
- `rosClient.ts` 또는 별도 ROS command helper에서 `/cmd_vel` topic을 캐시합니다.
- `rosConnected === false`이면 버튼 disabled 또는 명확한 상태 표시를 추가합니다.
- E-stop은 실패 여부를 사용자에게 알릴 수 있어야 합니다.

---

### 2. `useRosConnection.ts` - reconnect마다 subscriber 중복 생성 가능

**파일**: `src/hooks/useRosConnection.ts`

**현재**
```ts
ros.on("connection", () => {
  const batterySub = new ROSLIB.Topic(...);
  batterySub.subscribe(...);

  const poseSub = new ROSLIB.Topic(...);
  poseSub.subscribe(...);
});
```

**문제**
- subscriber가 `connection` callback 내부 지역 변수라 cleanup에서 직접 unsubscribe할 수 없습니다.
- reconnect가 반복되면 이전 connection의 구독 정리가 명확하지 않습니다.

**권장**
```ts
let batterySub: ROSLIB.Topic | null = null;
let poseSub: ROSLIB.Topic | null = null;

function unsubscribeAll() {
  batterySub?.unsubscribe();
  poseSub?.unsubscribe();
  batterySub = null;
  poseSub = null;
}
```

- `close`, cleanup 전에 `unsubscribeAll()` 호출
- 새 연결 전에 이전 `ros`와 subscriber 정리

---

### 3. `TopBar.tsx` - ping 상태가 실측값이 아님

**파일**: `src/components/layout/TopBar.tsx`

**현재**
```ts
const pingMs: number | null = fastapiConnected ? null : null;
```

**문제**
- `getPingTone`은 있지만 실제 ping 값은 없습니다.
- 화면에서 ping widget을 제거했거나 AI 상태로 대체한 상태라면 dead code가 남아 있습니다.

**권장**
- 선택 A: `getPingTone`과 `pingMs` 제거
- 선택 B: `DiagnosticsMonitor`의 `/ping` fetch 시간을 측정해 store에 저장하고 TopBar에서 표시

---

### 4. TypeScript 빌드 실패

**파일**: `src/main.tsx`

**현재 오류**
```txt
src/main.tsx(4,8): error TS2882:
Cannot find module or type declarations for side-effect import of './index.css'.
```

**권장**
- `src/vite-env.d.ts` 또는 `src/global.d.ts` 추가

```ts
/// <reference types="vite/client" />
```

또는

```ts
declare module "*.css";
```

---

## 🟡 Medium: 기능/운영 품질 보완

### 5. `AIOverlay.tsx` - bbox 좌표 계산은 수정됐지만 실제 화면 검증 필요

**파일**: `src/components/dashboard/AIOverlay.tsx`

**현재**
- `object-cover` crop 기준으로 rendered rect 계산을 수정했습니다.
- `ResizeObserver`로 컨테이너 크기를 추적합니다.

**남은 리스크**
- 서버 bbox 좌표계가 항상 `640x480`이라고 가정합니다.
- 실제 stream 해상도가 다르면 bbox가 다시 어긋납니다.

**권장**
- AI WebSocket payload에 `frame_width`, `frame_height`를 포함시키거나 설정값으로 분리
- 최소 16:9, 4:3, 좁은 화면에서 시각 검증

---

### 6. `useAIStream.ts` - `snapshotOriginal` 캡처 실패도 명시적으로 처리

**파일**: `src/hooks/useAIStream.ts`, `src/hooks/useVideoCapture.ts`

**현재**
- `useVideoCapture`는 CORS/canvas 실패 시 `undefined`를 반환합니다.
- `useAIStream`은 snapshot이 없어도 로그를 저장합니다.

**권장**
- 로그 항목에 `snapshotStatus?: "captured" | "unavailable"` 같은 상태를 추가하거나,
- UI에서 `No Image`의 원인을 알 수 있게 표시합니다.

---

### 7. `DriveController.tsx` - `driveMode` 이중 상태

**파일**: `src/components/dashboard/DriveController.tsx`

**현재**
```ts
const { driveMode, setDriveMode, rosConnected } = useRobotStore();
const [localMode, setLocalMode] = useState<DriveMode>(driveMode);
```

**문제**
- 외부에서 store의 `driveMode`가 변경되면 `localMode`가 따라가지 않습니다.

**권장**
- `localMode` 제거
- store의 `driveMode`를 단일 source of truth로 사용

---

### 8. `History.tsx` - demo 데이터와 실제 로그 정책 불일치

**파일**: `src/pages/History.tsx`

**현재**
- demo에는 `class: "none"` 항목이 있습니다.
- 실제 `useAIStream`은 `cls === "person"`일 때만 `pushDetectionLog` 합니다.

**권장**
- demo 데이터도 person-only로 맞추거나,
- 실제 로그에도 threshold 미달/none 이벤트를 기록할 정책인지 결정합니다.

---

### 9. `DiagnosticsMonitor.tsx` - FastAPI `/ping` 경로 계약 확인 필요

**파일**: `src/components/settings/DiagnosticsMonitor.tsx`

**현재**
```ts
fetch(`${fastapiUrl}/ping`, { signal: AbortSignal.timeout(3000) })
```

**리스크**
- 백엔드 health endpoint가 `/ping`이 아니면 항상 disconnected로 표시됩니다.

**권장**
- `docs/specs/API_DETAILS.md`에 health endpoint 명시
- FastAPI 실제 endpoint와 맞추기 (`/ping`, `/health`, `/api/health` 중 하나)

---

## 🟢 Low: 정리/문서화

### 10. `rosClient.ts` - 역할 확장

**현재**
- ROS instance getter/setter만 제공합니다.

**권장**
- `/cmd_vel` topic 캐시
- 연결 상태 helper
- 향후 `/map`, `/amcl_pose` 관련 공통 유틸 위치로 사용

---

### 11. 문서 단위 불일치 정리

**파일**
- `README.md`
- `docs/AGENTS.md`
- `docs/specs/API_DETAILS.md`

**문제**
- 일부 문서가 아직 `confidenceThreshold=0.5` 또는 0-1 기준을 언급합니다.
- 현재 코드는 0-100 기준입니다.

**권장**
- 모든 문서에서 `confidence`, `confidenceThreshold`를 `0..100`으로 통일

---

### 12. `MiniMap.tsx` 미구현

**파일**: `src/components/dashboard/MiniMap.tsx`

**현재**
- `ros2djs map viewport` placeholder만 렌더링합니다.

**권장**
- Phase 3로 남기는 경우 명시
- `/map`, `/amcl_pose` 구현 범위를 별도 티켓으로 분리

---

## 우선순위 요약

| 우선순위 | 항목 | 파일 | 복잡도 |
|---------|------|------|--------|
| 🔴 High | `/cmd_vel` topic 캐시 및 publish 실패 처리 | `DriveController.tsx`, `rosClient.ts` | 중간 |
| 🔴 High | ROS subscriber cleanup/reconnect 안정화 | `useRosConnection.ts` | 중간 |
| 🔴 High | TypeScript CSS import 선언 추가 | `src/vite-env.d.ts` 등 | 낮음 |
| 🔴 High | TopBar ping dead code 정리 또는 실측 구현 | `TopBar.tsx` | 낮음-중간 |
| 🟡 Medium | bbox 좌표 실제 화면 검증 및 frame size 일반화 | `AIOverlay.tsx` | 중간 |
| 🟡 Medium | snapshot 실패 상태 표시 | `useAIStream.ts`, `DetailModal.tsx` | 낮음 |
| 🟡 Medium | driveMode 단일 상태화 | `DriveController.tsx` | 낮음 |
| 🟡 Medium | demo log 정책 정리 | `History.tsx` | 낮음 |
| 🟢 Low | confidence 문서 단위 통일 | docs | 낮음 |
| 🟢 Low | MiniMap Phase 분리 | `MiniMap.tsx`, docs | 중간 |

---

## 권장 작업 순서

1. TypeScript 실패 해결 (`vite-env.d.ts` 추가)
2. ROS connection lifecycle 정리 (`useRosConnection`, `rosClient`)
3. `/cmd_vel` publish path 안정화 (`DriveController`)
4. TopBar 상태 표시 dead code 정리
5. 실제 Jetson/rosbridge 환경에서 ROS, camera, AI stream smoke test
6. bbox 좌표/캡처 결과를 desktop viewport에서 시각 검증
7. README/AGENTS/API_DETAILS 문서의 confidence 단위 정리

---

## 검증 체크리스트

- [ ] `npm run build`
- [ ] `npx tsc -b`
- [ ] rosbridge down 상태에서 `rosConnected=false`
- [ ] rosbridge up 후 자동 재연결 및 `rosConnected=true`
- [ ] `/battery_state` 수신 시 TopBar battery 반영
- [ ] `/amcl_pose` 수신 시 store pose 반영
- [ ] manual forward/back/left/right가 `/cmd_vel` 1회 publish
- [ ] E-stop이 연결 상태에서 zero velocity publish
- [ ] AI stream disconnect 후 3초 재연결
- [ ] detection log가 3초 throttle로 쌓임
- [ ] snapshot CORS 실패 시 UI가 깨지지 않음
- [ ] bbox가 실제 영상 위 탐지 위치와 일치

