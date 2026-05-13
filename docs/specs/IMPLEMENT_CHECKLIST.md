# 구현 점검 리스트 (Implementation Checklist)

> 기준일: 2026-05-13  
> 현재 워크트리 기준 주요 구현 리스크와 남은 작업을 정리한다.  
> 이 문서는 우선 `IMPLEMENT_CHECKLIST.md` 한 파일 안에서 관리하며, 이후 `PHASE2_PLAN.md` / `UI_GAPS.md`로 분리할 수 있다.

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
| Drive control | 공유 ROS 인스턴스 사용, `/cmd_vel` topic cache, manual drive, E-stop 구현 | 보완 필요 |
| Dashboard overlay | `object-cover` crop 기준 bbox 계산 구현 | 실환경 검증 필요 |
| History | detectionLog 연결, confidence 0-100 반영 | 보완 필요 |
| Settings | localStorage persistence, confidence migration 구현 | 보완 필요 |
| TopBar/Diagnostics | ROS/FastAPI/Camera/AI/Battery 상태 표시 구현 | ping/경고 보완 필요 |
| MiniMap | placeholder | Phase 3 보류 |


## High: 우선 수정 필요

### 1. `StorageSettings`의 storage policy가 실제 캡처 동작에 반영되지 않음

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

### 2. 오디오 알람 설정이 `CriticalAlarmOverlay`와 연결되지 않음

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

### 3. `AIStatusPanel`의 FREEZE 버튼이 동작하지 않음

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

### 4. Settings의 destructive action 버튼들이 미연결 상태

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

### 5. `AlertFeed`가 raw BBox를 노출하고 pose/map location을 표시하지 않음

**파일**: `src/components/dashboard/AlertFeed.tsx`, `src/store/robotStore.ts`, `src/hooks/useAIStream.ts`

**현재**
- Alert card에 `BBox: x, y / w x h` raw 숫자가 직접 표시된다.
- detection 시점의 robot pose가 log에 저장되지 않는다.

**권장**
- `DetectionLogEntry`에 `pose?: Pose`를 추가한다.
- `useAIStream`에서 log 생성 시 현재 pose snapshot을 함께 저장한다.
- Alert card는 raw BBox 대신 `X / Y` 좌표를 우선 표시한다.
- BBox는 필요하면 tooltip 또는 debug view로만 이동한다.

**완료 조건**
- [ ] detection log에 pose snapshot 저장
- [ ] Alert card에 map location 표시
- [ ] raw BBox 직접 노출 제거 또는 debug 처리

---

### 6. snapshot 실패 원인이 UI에 드러나지 않음

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

### 7. History filter 정책이 실제 로그 정책과 맞지 않음

**파일**: `src/pages/History.tsx`, `src/components/history/FilterBar.tsx`

**현재**
- 실제 `useAIStream`은 `class === "person"`일 때만 detection log를 저장한다.
- demo data와 filter에는 `"none"` 항목/옵션이 남아 있다.
- `operator` filter는 값은 저장되지만 실제 필터링에 사용되지 않는다.

**권장**
- person-only 로그 정책을 유지한다면 demo data와 filter에서 `"none"`을 제거한다.
- operator 데이터가 없다면 operator filter UI를 제거한다.
- 장기적으로 operator를 쓰려면 `DetectionLogEntry.operator`를 추가하고 저장 경로까지 연결한다.

**완료 조건**
- [ ] demo data의 `class: "none"` 제거
- [ ] FilterBar의 `None` option 제거 또는 실제 로그 정책 변경
- [ ] operator filter 제거 또는 실제 필터 조건 연결

---

### 8. False Positive 상태가 세션 내 메모리에만 있음

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

### 9. TopBar latency 표시가 spec과 맞지 않음

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

### 10. E-stop 성공/실패 피드백이 약함

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

### 11. bbox 좌표계가 고정 해상도 가정에 묶여 있음

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

### 12. confidence 단위 문서 불일치

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

### 13. MiniMap은 Phase 3 보류로 명확히 표시

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

1. `StoragePolicy`를 `useAIStream` 캡처 경로에 연결
2. `CriticalAlarmOverlay` 오디오 알람과 settings 값 연결
3. `AIStatusPanel` FREEZE 버튼 연결
4. `StorageSettings` destructive action 구현 또는 disabled 처리
5. `AlertFeed` pose 연동 및 raw BBox 표시 정리
6. History filter/demo/false positive persistence 정리
7. TopBar latency 표시 구현 또는 spec 조정
8. 실제 Jetson/rosbridge 환경에서 ROS, camera, AI stream smoke test
9. bbox 좌표/캡처 결과를 desktop/mobile viewport에서 시각 검증
10. README/AGENTS/API_DETAILS confidence 단위 정리

## 통합 검증 체크리스트

- [ ] `npm run build`
- [ ] `npx tsc -b`
- [ ] rosbridge down 상태에서 `rosConnected=false`
- [ ] rosbridge up 후 자동 재연결 및 `rosConnected=true`
- [ ] `/battery_state` 수신 시 TopBar battery 반영
- [ ] `/amcl_pose` 수신 시 store pose 반영
- [ ] manual forward/back/left/right가 `/cmd_vel` publish
- [ ] E-stop이 연결 상태에서 zero velocity publish
- [ ] E-stop 성공/실패 feedback 표시
- [ ] AI stream disconnect 후 3초 재연결
- [ ] detection log가 3초 throttle로 쌓임
- [ ] `storagePolicy === "original"`일 때 delayed snapshot skip
- [ ] `storagePolicy === "original+inverted"`일 때 delayed snapshot 저장
- [ ] snapshot CORS 실패 시 UI가 깨지지 않고 원인이 표시됨
- [ ] audio alarm toggle/volume이 CriticalAlarmOverlay에 반영됨
- [ ] FREEZE 버튼 클릭 시 현재 프레임 캡처
- [ ] AlertCard에 pose 좌표 표시
- [ ] History demo/filter 정책이 person-only 로그 정책과 일치
- [ ] false positive 상태가 페이지 재방문 후 유지
- [ ] bbox가 실제 영상 위 탐지 위치와 일치
