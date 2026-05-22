# 구현 점검 리스트 (Implementation Checklist)

> 기준일: 2026-05-22  
> 현재 워크트리 기준 주요 구현 리스크와 남은 작업을 정리한다.  

## 현재 검증 상태

| 명령 | 결과 | 메모 |
|------|------|------|
| `npm run build` | 통과 | Vite production build 성공 |
| `npx tsc -b` | 통과 | `src/vite-env.d.ts` 존재, CSS side-effect import 문제 해결됨 |

## 현재 상태 요약

| 영역 | 현재 상태 | 판정 |
|------|----------|------|
| AI WebSocket | `useAIStream` mount, reconnect, 3초 throttle, 2회 snapshot capture 구현 | 보완 필요 |
| Camera stream | settings IP 기반 MJPEG URL, `cameraConnected` onLoad/onError 반영 | 검증 필요 |
| ROS bridge | `useRosConnection` mount, reconnect, battery/pose subscribe, cleanup 구현 | 대체로 완료 |
| Drive control | 공유 ROS 인스턴스 사용, `/cmd_vel` topic cache, manual drive, E-stop 구현. 현재 click 단발 명령 중심 | 보완 필요 |
| Dashboard overlay | `object-cover` crop 기준 bbox 계산 구현 | 실환경 검증 필요 |
| Detection UI | bbox overlay 구현. 현재 class label/person 표시 정책은 수정 필요 | 보완 필요 |
| History | frontend `detectionLog` 연결, confidence 0-100 반영. Jetson CSV 누적 저장/불러오기 필요 | 보완 필요 |
| Settings | localStorage persistence, confidence migration 구현 | 보완 필요 |
| TopBar/Diagnostics | ROS/FastAPI/Camera/AI/Battery 상태 표시 구현 | ping/경고 보완 필요 |
| MiniMap | placeholder | Phase 3 보류 |


## High: 우선 수정 필요

### 1. Detection log를 Jetson CSV에 누적 저장하고 다시 불러오기

**파일**: `src/hooks/useAIStream.ts`, `src/pages/History.tsx`, `src/store/robotStore.ts`, backend/Jetson logging endpoint

**요구**
- detection log는 브라우저 메모리/localStorage에만 의존하지 않는다.
- Jetson 쪽에 CSV 파일로 계속 append 저장한다.
- History 화면은 Jetson에 누적된 CSV를 불러와 이전 기록까지 볼 수 있어야 한다.

**문제**
- 현재 frontend `detectionLog`는 런타임 상태 중심이라 장기 누적 기록으로 쓰기 어렵다.
- 브라우저를 새로 열거나 다른 장비에서 접속하면 Jetson에 쌓인 기록과 동기화되지 않는다.

**권장**
- Jetson/FastAPI에 CSV append endpoint를 둔다.
  - 예: `POST /api/history/log`
  - body: timestamp, confidence, bbox, pose, snapshot status 등
- CSV read endpoint를 둔다.
  - 예: `GET /api/history`
  - CSV를 파싱해 JSON array로 반환
- frontend는 detection 발생 시 backend로 log append를 요청한다.
- History mount 시 `/api/history`를 fetch해서 store에 hydrate한다.
- 네트워크 실패 시 frontend queue 또는 retry 정책을 둔다.

**완료 조건**
- [ ] detection 발생 시 Jetson CSV에 row append
- [ ] 앱 재접속 후 History에서 기존 CSV 기록 조회
- [ ] CSV header/schema 문서화
- [ ] backend 통신 실패 시 UI가 깨지지 않고 재시도 또는 실패 상태 표시
- [ ] frontend 임시 log와 Jetson CSV log의 중복 저장 방지 정책 결정

---

### 2. Manual control을 press-and-hold 방식으로 변경

**파일**: `src/components/dashboard/DriveController.tsx`, `src/lib/rosClient.ts`

**요구**
- 방향 버튼을 한 번 클릭하면 한 번만 움직이는 방식이 아니라, 버튼을 꾹 누르는 동안 계속 움직여야 한다.
- 버튼을 떼면 즉시 zero velocity를 publish해 정지해야 한다.

**현재**
- manual forward/back/left/right는 click handler에서 `/cmd_vel`을 1회 publish한다.

**권장**
- `pointerdown` 또는 `mousedown/touchstart`에서 interval publish를 시작한다.
- `pointerup`, `pointerleave`, `blur`, `visibilitychange`에서 interval을 정리하고 `publishCmdVel(0, 0)`을 보낸다.
- publish interval은 100-200ms 범위로 시작하고 실제 TurtleBot 반응을 보고 조정한다.
- E-stop은 hold interval보다 높은 우선순위로 interval을 즉시 중단해야 한다.

**완료 조건**
- [ ] 버튼을 누르는 동안 같은 방향 `/cmd_vel`이 반복 publish됨
- [ ] 버튼을 떼면 zero velocity publish
- [ ] pointer cancel/화면 이탈/탭 비활성화 시에도 정지
- [ ] E-stop 클릭 시 hold interval 즉시 중단

---

### 3. Auto Patrol 모드 제거

**파일**: `src/components/dashboard/DriveController.tsx`, `src/store/robotStore.ts`, 관련 UI 문서

**요구**
- Auto Patrol 기능과 UI를 제거한다.
- 조작 모드는 manual drive 중심으로 단순화한다.

**현재**
- `DriveController`에는 Auto Patrol / Manual Mode toggle UI가 있다.
- store에도 `driveMode` 상태가 남아 있다.

**권장**
- Auto Patrol 버튼을 제거한다.
- `driveMode`가 다른 컴포넌트 표시용으로만 쓰이는지 확인한다.
- 더 이상 필요 없다면 `driveMode`, `setDriveMode`, 관련 타입을 제거한다.
- `AIStatusPanel` 등에서 mode 표시가 필요하면 "Manual" 고정 표시 또는 해당 UI 제거를 결정한다.

**완료 조건**
- [ ] Auto Patrol 버튼이 화면에서 제거됨
- [ ] auto mode로 전환되는 경로가 없음
- [ ] 불필요한 `driveMode` 상태 제거 또는 manual-only로 정리
- [ ] 관련 문서에서 Auto Patrol 요구 제거

---

### 4. Detection UI에서 class label(`person`) 제거

**파일**: `src/components/dashboard/AIOverlay.tsx`, `src/components/dashboard/AIStatusPanel.tsx`, `src/components/dashboard/AlertFeed.tsx`, `src/pages/History.tsx`

**요구**
- 화면에 `person` class label을 직접 표시하지 않는다.
- bbox 위/안에는 class명 대신 "Detected" 같은 감지 문구만 표시한다.

**현재**
- AI payload와 store는 `class: "person" | "none"` 정책을 사용한다.
- 일부 UI는 `person` label 또는 class 값을 그대로 노출할 수 있다.

**권장**
- backend/store의 `class` 값은 내부 판단용으로 유지해도 된다.
- operator-facing UI에서는 `person` 대신 "Detected"를 표시한다.
- bbox label, Alert card, History table/detail에서 class 컬럼/텍스트 노출 여부를 점검한다.
- History에서 class filter가 필요 없다면 제거한다.

**완료 조건**
- [ ] bbox overlay에 `person` 대신 "Detected" 표시
- [ ] AlertFeed/History에서 `person` label 직접 노출 제거 또는 운영자용 문구로 대체
- [ ] class filter 제거 또는 내부 필터로 숨김 처리
- [ ] detection 조건은 기존 `class === "person"` 기반으로 유지되는지 확인

---

### 5. `StorageSettings`의 storage policy가 실제 캡처 동작에 반영되지 않음

**파일**: `src/components/settings/StorageSettings.tsx`, `src/hooks/useAIStream.ts`

**현재**
- `settingsStore.storagePolicy`는 `"original"` 또는 `"original+inverted"`로 저장된다.
- `useAIStream`은 정책과 무관하게 항상 `snapshotOriginal`과 `snapshotInverted`를 캡처한다.

**문제**
- 사용자가 "original only"를 선택해도 1.5초 후 추가 캡처가 실행된다.
- 설정 UI와 실제 저장 정책이 다르다.

**권장**
- `useAIStream`에서 `storagePolicy`를 읽는다.
- `storagePolicy === "original"`이면 delayed snapshot timer를 만들지 않는다.
- `storagePolicy === "original+inverted"`일 때만 1.5초 후 두 번째 캡처를 수행한다.

**완료 조건**
- [ ] `storagePolicy === "original"`일 때 `snapshotInverted`가 저장되지 않음
- [ ] `storagePolicy === "original+inverted"`일 때 delayed snapshot이 저장됨
- [ ] 정책 변경 후 새 detection log부터 즉시 반영됨

---

### 6. 오디오 알람 설정이 `CriticalAlarmOverlay`와 연결되지 않음

**파일**: `src/components/settings/AIConfig.tsx`, `src/components/dashboard/CriticalAlarmOverlay.tsx`

**현재**
- `audioAlarmEnabled`, `volume` 값은 settings store에 저장된다.
- `CriticalAlarmOverlay`는 visual alarm만 표시하고 오디오 재생은 구현되어 있지 않다.

**문제**
- Settings의 오디오 알람 토글/볼륨이 실제 동작에 영향을 주지 않는다.
- Phase 2 spec의 "audio alert if enabled" 조건을 충족하지 못한다.

**권장**
- `CriticalAlarmOverlay`에서 `audioAlarmEnabled`, `volume`을 읽는다.
- `audioAlarmEnabled === true`이고 `person + threshold` 조건을 만족할 때만 알람을 재생한다.
- `audio.volume = volume / 100`으로 반영한다.
- 브라우저 autoplay 제한 때문에 최초 재생 실패 가능성을 UI에서 방어한다.

**완료 조건**
- [ ] alarm sound asset 위치 결정 (`public/sounds/alarm.mp3` 등)
- [ ] detection 발생 시 오디오 알람 재생
- [ ] detection 해제 시 오디오 정지 및 재생 위치 초기화
- [ ] Settings의 toggle/volume 변경이 즉시 반영됨

---

### 7. `AIStatusPanel`의 FREEZE 버튼이 동작하지 않음

**파일**: `src/components/dashboard/AIStatusPanel.tsx`, `src/pages/Dashboard.tsx`

**현재**
- `FREEZE` 버튼이 렌더링되지만 `onClick`이 없다.

**문제**
- 화면상 주요 command처럼 보이지만 실제 동작하지 않는다.
- 운영자가 버튼을 눌러도 피드백이 없어 기능 신뢰도가 떨어진다.

**권장**
- `AIStatusPanel`에 `onFreezeFrame` prop을 추가한다.
- `Dashboard`에서 `useVideoCapture`의 `capture()`와 연결한다.
- 캡처 결과는 overlay, modal, 또는 download action 중 하나로 명확히 보여준다.

**완료 조건**
- [ ] FREEZE 클릭 시 현재 프레임 캡처
- [ ] 캡처 성공/실패 피드백 표시
- [ ] CORS 실패 시 UI가 깨지지 않음

---

### 8. Settings의 destructive action 버튼들이 미연결 상태

**파일**: `src/components/settings/StorageSettings.tsx`, `src/store/robotStore.ts`

**현재**
- "Clear Local Cache", "Delete Old Logs" 버튼이 UI에 있지만 실제 동작이 없다.
- "720 MB", "> 30 Days" 같은 값도 placeholder다.

**문제**
- 사용자가 데이터 삭제가 된 것으로 오해할 수 있다.
- 로그 저장 정책과 정리 기능의 신뢰도가 낮아진다.

**권장**
- 미구현 상태라면 버튼을 disabled 처리하고 "Not available" 상태를 표시한다.
- 구현한다면 삭제 전 확인 다이얼로그를 둔다.
- `clearDetectionLog()`와 30일 이전 로그 제거 helper를 store에 추가한다.

**완료 조건**
- [ ] Clear Local Cache가 detection log와 관련 localStorage 데이터를 정리
- [ ] Delete Old Logs가 기준일 이전 로그만 제거
- [ ] 삭제 전 확인 또는 undo 제공
- [ ] placeholder 용량 표시 제거 또는 실측값으로 교체

## Medium: 기능/운영 품질 보완

### 9. `AlertFeed`가 raw BBox를 노출하고 pose/map location을 표시하지 않음

**파일**: `src/components/dashboard/AlertFeed.tsx`, `src/store/robotStore.ts`, `src/hooks/useAIStream.ts`

**현재**
- Alert card에 `BBox: x, y / w x h` raw 숫자가 직접 표시된다.
- detection 시점의 robot pose가 log에 저장되지 않는다.
- class label이 운영자 UI에 그대로 노출될 수 있다.

**권장**
- `DetectionLogEntry`에 `pose?: Pose`를 추가한다.
- `useAIStream`에서 log 생성 시 현재 pose snapshot을 함께 저장한다.
- Alert card는 raw BBox 대신 `X / Y` 좌표를 우선 표시한다.
- BBox는 필요하면 tooltip 또는 debug view로만 이동한다.
- card 문구는 `person` 대신 "Detected" 기준으로 통일한다.

**완료 조건**
- [ ] detection log에 pose snapshot 저장
- [ ] Alert card에 map location 표시
- [ ] raw BBox 직접 노출 제거 또는 debug 처리
- [ ] Alert card에서 `person` label 직접 노출 제거

---

### 10. snapshot 실패 원인이 UI에 드러나지 않음

**파일**: `src/hooks/useAIStream.ts`, `src/hooks/useVideoCapture.ts`, `src/components/history/DetailModal.tsx`

**현재**
- CORS/canvas 실패 시 `capture()`가 `undefined`를 반환한다.
- UI에서는 단순히 이미지가 없는 상태로 보인다.

**권장**
- `DetectionLogEntry`에 `snapshotStatus?: "captured" | "unavailable"` 또는 `snapshotError?: string`을 추가한다.
- `DetailModal`에서 "No Image" 대신 "Capture unavailable" 같은 원인성 메시지를 표시한다.
- `snapshotInverted` 이름은 delayed capture 의미가 더 강하므로 `snapshotDelayed` rename을 검토한다.

**완료 조건**
- [ ] snapshot capture 성공/실패 상태 저장
- [ ] Detail modal에서 실패 상태를 명확히 표시
- [ ] 실제 Jetson stream에서 2회 캡처 검증

---

### 11. History filter 정책이 실제 로그 정책과 맞지 않음

**파일**: `src/pages/History.tsx`, `src/components/history/FilterBar.tsx`

**현재**
- 실제 `useAIStream`은 `class === "person"`일 때만 detection log를 저장한다.
- demo data와 filter에는 `"none"` 항목/옵션이 남아 있다.
- `operator` filter는 값은 저장되지만 실제 필터링에 사용되지 않는다.
- 새 UI 요구사항상 operator-facing 화면에서는 `person` class label을 제거해야 한다.

**권장**
- person-only 로그 정책을 유지한다면 demo data와 filter에서 `"none"`을 제거한다.
- class label을 화면에서 제거한다면 class filter도 제거한다.
- operator 데이터가 없다면 operator filter UI를 제거한다.
- 장기적으로 operator를 쓰려면 `DetectionLogEntry.operator`를 추가하고 저장 경로까지 연결한다.

**완료 조건**
- [ ] demo data의 `class: "none"` 제거
- [ ] class filter 제거 또는 내부-only 정책으로 정리
- [ ] operator filter 제거 또는 실제 필터 조건 연결

---

### 12. False Positive 상태가 세션 내 메모리에만 있음

**파일**: `src/pages/History.tsx`, `src/components/history/DetailModal.tsx`

**현재**
- False Positive 버튼과 `statusOverride`는 구현되어 있다.
- 페이지 새로고침/재방문 후 상태가 유지되지 않는다.

**권장**
- `localStorage`에 false positive override를 저장한다.
- key 예: `fp_overrides`
- detection id가 없다면 timestamp 기반 key의 충돌 가능성을 고려한다.

**완료 조건**
- [ ] false positive override localStorage persist
- [ ] History mount 시 override hydrate
- [ ] 재방문 후 상태 유지

---

### 13. TopBar latency 표시가 spec과 맞지 않음

**파일**: `src/components/layout/TopBar.tsx`, `src/components/settings/DiagnosticsMonitor.tsx`, `src/store/robotStore.ts`

**현재**
- TopBar는 ROS/FastAPI/Camera/AI/Battery 상태를 표시한다.
- `UI_DETAILS.md`와 `API_DETAILS.md`에는 network ping/latency 표시가 요구된다.
- 현재 TopBar에는 latency 값이 없다.

**권장**
- 선택 A: spec에서 latency 표시 요구를 제거한다.
- 선택 B: `DiagnosticsMonitor`의 `/ping` fetch 왕복 시간을 측정해 store에 저장하고 TopBar에 표시한다.

**완료 조건**
- [ ] latency 표시를 구현하거나 관련 spec을 명확히 조정
- [ ] `/ping` endpoint 실패 시 latency가 `--`로 표시됨

---

### 14. E-stop 성공/실패 피드백이 약함

**파일**: `src/components/dashboard/DriveController.tsx`

**현재**
- E-stop은 `publishCmdVel(0, 0)`를 호출한다.
- 성공/실패 여부가 UI에 반영되지 않는다.
- ROS disconnected 상태에서도 같은 버튼처럼 보인다.

**권장**
- publish 성공 시 짧은 visual feedback을 표시한다.
- 실패 또는 ROS disconnected 상태에서는 경고 문구를 표시한다.
- E-stop 자체를 완전히 disabled할지는 별도로 결정한다. 안전 버튼은 연결 복구 직후 즉시 눌릴 수 있어야 하므로 UI 설계가 중요하다.

**완료 조건**
- [ ] E-stop 성공 feedback 표시
- [ ] ROS disconnected 상태 표시
- [ ] publish 실패 시 사용자에게 알림

---

### 15. bbox 좌표계가 고정 해상도 가정에 묶여 있음

**파일**: `src/components/dashboard/AIOverlay.tsx`

**현재**
- overlay는 `object-cover` crop 기준으로 보정되어 있다.
- 단, 서버 bbox 좌표계가 항상 같은 frame size라고 가정한다.

**권장**
- AI WebSocket payload에 `frame_width`, `frame_height`를 포함한다.
- 불가능하면 frontend 설정값으로 source frame size를 분리한다.
- 16:9, 4:3, narrow layout에서 실제 영상 기준으로 시각 검증한다.

**완료 조건**
- [ ] bbox source frame size 계약 명시
- [ ] 실제 stream에서 bbox 위치 검증
- [ ] viewport 변경 시 overlay 위치 유지

## Low: 정리/문서화

### 16. confidence 단위 문서 불일치

**파일**: `README.md`, `docs/AGENTS.md`, `docs/specs/API_DETAILS.md`

**현재**
- 현재 코드는 `confidenceThreshold`를 0-100 기준으로 사용한다.
- 일부 문서에는 아직 `0.5`, `0-1` 기준 표현이 남아 있다.

**권장**
- `confidence`, `confidenceThreshold`는 모두 `0..100` percent scale로 통일한다.
- backend API threshold가 0-1인지 0-100인지도 계약을 명시한다.

**완료 조건**
- [ ] README threshold 설명 0-100으로 수정
- [ ] docs/AGENTS.md 기본값 50으로 수정
- [ ] API_DETAILS threshold payload 단위 명시

---

### 17. MiniMap은 Phase 3 보류로 명확히 표시

**파일**: `src/components/dashboard/MiniMap.tsx`, `docs/specs/IMPLEMENTATION_PHASES.md`, `docs/specs/UI_DETAILS.md`

**현재**
- `MiniMap`은 placeholder다.
- `IMPLEMENTATION_PHASES.md`에서는 Phase 3 제외로 표시되어 있으나, `UI_DETAILS.md`에는 구현 대상처럼 남아 있다.

**권장**
- Phase 1/2에서는 placeholder 유지라고 명시한다.
- `/map`, `/amcl_pose`, waypoint, detection marker는 Phase 3 ticket으로 분리한다.

**완료 조건**
- [ ] UI_DETAILS에서 MiniMap phase 명시
- [ ] 구현 체크리스트에서는 Phase 3 보류 항목으로만 추적

## 권장 작업 순서

1. Jetson CSV log append/read API 계약 확정
2. frontend detection log를 Jetson CSV 저장/불러오기 흐름에 연결
3. manual drive를 press-and-hold 반복 publish 방식으로 변경
4. Auto Patrol UI/state 제거
5. detection UI에서 `person` label 제거 후 "Detected" 문구로 통일
6. `StoragePolicy`를 `useAIStream` 캡처 경로에 연결
7. `CriticalAlarmOverlay` 오디오 알람과 settings 값 연결
8. `AIStatusPanel` FREEZE 버튼 연결
9. `StorageSettings` destructive action 구현 또는 disabled 처리
10. `AlertFeed` pose 연동 및 raw BBox 표시 정리
11. History filter/demo/false positive persistence 정리
12. TopBar latency 표시 구현 또는 spec 조정
13. 실제 Jetson/rosbridge 환경에서 ROS, camera, AI stream smoke test
14. bbox 좌표/캡처 결과를 desktop/mobile viewport에서 시각 검증
15. README/AGENTS/API_DETAILS confidence 단위 정리

## 통합 검증 체크리스트

- [ ] `npm run build`
- [ ] `npx tsc -b`
- [ ] rosbridge down 상태에서 `rosConnected=false`
- [ ] rosbridge up 후 자동 재연결 및 `rosConnected=true`
- [ ] `/battery_state` 수신 시 TopBar battery 반영
- [ ] `/amcl_pose` 수신 시 store pose 반영
- [ ] manual forward/back/left/right를 누르는 동안 `/cmd_vel` 반복 publish
- [ ] manual control 버튼을 떼면 zero velocity publish
- [ ] pointer cancel/blur/visibilitychange 시 robot 정지
- [ ] Auto Patrol 버튼과 auto mode 전환 경로 제거
- [ ] E-stop이 연결 상태에서 zero velocity publish
- [ ] E-stop 성공/실패 feedback 표시
- [ ] AI stream disconnect 후 3초 재연결
- [ ] detection log가 3초 throttle로 쌓임
- [ ] detection log가 Jetson CSV에 append됨
- [ ] History 진입 시 Jetson CSV 누적 log를 불러옴
- [ ] 앱 재접속 후에도 이전 detection log 확인 가능
- [ ] `storagePolicy === "original"`일 때 delayed snapshot skip
- [ ] `storagePolicy === "original+inverted"`일 때 delayed snapshot 저장
- [ ] snapshot CORS 실패 시 UI가 깨지지 않고 원인이 표시됨
- [ ] audio alarm toggle/volume이 CriticalAlarmOverlay에 반영됨
- [ ] FREEZE 버튼 클릭 시 현재 프레임 캡처
- [ ] bbox overlay에 `person` 대신 "Detected" 표시
- [ ] AlertFeed/History에서 `person` class label 직접 노출 없음
- [ ] AlertCard에 pose 좌표 표시
- [ ] History demo/filter 정책이 person-only 로그 정책과 일치
- [ ] false positive 상태가 페이지 재방문 후 유지
- [ ] bbox가 실제 영상 위 탐지 위치와 일치
