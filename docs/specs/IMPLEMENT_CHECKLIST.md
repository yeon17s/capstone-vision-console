# 구현 점검 리스트 (Implementation Checklist)

> 기준일: 2026-05-22  
> 현재 워크트리 기준으로 아직 구현/검증이 남은 항목만 추적한다.

## 현재 기준 상태

| 영역 | 현재 상태 | 남은 일 |
|------|----------|---------|
| History / CSV log | frontend CSV append/fetch, pending queue, `recentLog`/`historyLog` 분리 구현 | Jetson/FastAPI 실환경 smoke test |
| Drive control | press-and-hold `/cmd_vel` 반복 publish, release/blur/hidden 정지, E-stop feedback 구현 | 실제 rosbridge/TurtleBot smoke test |
| Detection UI | operator-facing `person` label 제거, `Detected` 문구와 pose location 표시 | bbox 위치 실환경 검증 |
| Settings | threshold/audio/storage UI와 localStorage persistence 구현 | storage/audio 설정의 실제 동작 연결 |
| TopBar/Diagnostics | ROS/FastAPI/Camera/AI/Battery 상태 표시 구현 | latency 표시 또는 spec 정리 |
| MiniMap | placeholder | Phase 3 보류 문서 정리 |

## High: 우선 수정 필요

### 1. Jetson/FastAPI CSV history 실환경 검증

**파일**: `src/hooks/useAIStream.ts`, `src/lib/historyApi.ts`, `src/pages/History.tsx`, Jetson/FastAPI backend

**현재**
- detection 발생 시 frontend는 `POST /api/history/log`를 pending queue 경유로 호출한다.
- queue는 localStorage에 유지되고, 같은 backend 대상별 순서를 보존한다.
- History 진입 시 `GET /api/history` 결과를 `historyLog`에 merge한다.
- CSV row shape는 `HistoryRow` 타입으로 정리되어 있다.

**남은 리스크**
- 실제 Jetson/FastAPI가 해당 endpoint와 CSV schema를 동일하게 구현했는지 아직 확인 필요.
- 브라우저 새로고침, 네트워크 단절, backend 재연결 상황에서 실제 CSV 누적/조회 검증 필요.

**완료 조건**
- [ ] 실제 Jetson/FastAPI에서 `POST /api/history/log` row append 확인
- [ ] 실제 Jetson/FastAPI에서 `GET /api/history` 누적 log 조회 확인
- [ ] frontend pending queue가 backend 복구 후 순서대로 drain되는지 확인
- [ ] CSV header/schema를 `docs/specs/API_DETAILS.md`에 명시

---

### 2. `StorageSettings` storage policy를 실제 캡처 동작에 연결

**파일**: `src/components/settings/StorageSettings.tsx`, `src/hooks/useAIStream.ts`

**현재**
- `settingsStore.storagePolicy`는 `"original"` 또는 `"original+inverted"`로 저장된다.
- `useAIStream`은 정책과 무관하게 `snapshotOriginal`과 delayed `snapshotInverted`를 모두 캡처한다.

**완료 조건**
- [x] `storagePolicy === "original"`일 때 delayed snapshot skip
- [x] `storagePolicy === "original+inverted"`일 때 delayed snapshot 저장
- [x] 정책 변경 후 새 detection log부터 즉시 반영

---

### 3. 오디오 알람 설정을 `CriticalAlarmOverlay`에 연결

**파일**: `src/components/settings/AIConfig.tsx`, `src/components/dashboard/CriticalAlarmOverlay.tsx`

**현재**
- `audioAlarmEnabled`, `volume` 값은 settings store에 저장된다.
- `CriticalAlarmOverlay`는 visual alarm만 표시하고 오디오 재생은 구현되어 있지 않다.

**완료 조건**
- [x] alarm sound asset 위치 결정 (`public/sounds/alarm.mp3` 등)
- [x] detection 발생 시 설정값에 따라 오디오 알람 재생
- [x] detection 해제 시 오디오 정지 및 재생 위치 초기화
- [x] `volume` 변경 즉시 반영
- [x] 브라우저 autoplay 실패 시 UI가 깨지지 않음

---

### 4. `AIStatusPanel` FREEZE 버튼 연결

**파일**: `src/components/dashboard/AIStatusPanel.tsx`, `src/pages/Dashboard.tsx`

**현재**
- `FREEZE` 버튼이 렌더링되지만 `onClick`이 없다.

**완료 조건**
- [x] FREEZE 클릭 시 현재 프레임 캡처
- [x] 캡처 결과를 overlay, modal, 또는 별도 preview로 표시
- [x] 캡처 실패 시 사용자 피드백 표시

---

### 5. `StorageSettings` destructive action 구현 또는 비활성화

**파일**: `src/components/settings/StorageSettings.tsx`, `src/store/robotStore.ts`

**현재**
- "Clear Local Cache", "Delete Old Logs" 버튼이 UI에 있지만 실제 동작이 없다.
- "720 MB", "> 30 Days" 값은 placeholder다.

**완료 조건**
- [ ] 미구현 상태라면 버튼 disabled 및 "Not available" 표시
- [ ] 구현 시 Clear Local Cache가 runtime/local pending/history cache 정리
- [ ] 구현 시 Delete Old Logs가 기준일 이전 log 제거
- [ ] 삭제 전 확인 dialog 또는 undo 제공
- [ ] placeholder 용량 표시 제거 또는 실측값으로 교체

## Medium: 기능/운영 품질 보완

### 6. snapshot 실패 원인 표시

**파일**: `src/hooks/useAIStream.ts`, `src/hooks/useVideoCapture.ts`, `src/components/history/DetailModal.tsx`

**현재**
- CORS/canvas 실패 시 `capture()`가 `undefined`를 반환한다.
- Detail 화면에서는 단순히 `No Image`로 표시된다.

**완료 조건**
- [x] `DetectionLogEntry`에 `snapshotStatus` 또는 `snapshotError` 추가
- [x] Detail 화면에서 `Capture unavailable` 등 원인성 메시지 표시
- [x] delayed snapshot 의미가 명확하도록 `snapshotInverted` naming 또는 UI label 정리

---

### 7. TopBar latency 표시 또는 spec 조정

**파일**: `src/components/layout/TopBar.tsx`, `src/components/settings/DiagnosticsMonitor.tsx`, `src/store/robotStore.ts`, docs

**현재**
- TopBar는 ROS/FastAPI/Camera/AI/Battery 상태를 표시한다.
- specs에는 network ping/latency 표시 요구가 남아 있다.
- 현재 TopBar에는 latency 값이 없다.

**완료 조건**
- [ ] `/ping` fetch 왕복 시간 측정 후 store에 저장하고 TopBar에 표시하거나,
- [ ] latency 요구를 spec에서 제거/보류로 명시
- [ ] `/ping` 실패 시 latency는 `--`로 표시

---

### 8. bbox source frame size 일반화 및 실환경 검증

**파일**: `src/components/dashboard/AIOverlay.tsx`, backend AI WebSocket contract

**현재**
- overlay는 `object-cover` crop 기준으로 보정되어 있다.
- source frame size는 frontend에서 `640x480`으로 고정 가정한다.

**완료 조건**
- [ ] AI WebSocket payload에 `frame_width`, `frame_height` 포함하거나 frontend 설정값으로 분리
- [ ] 실제 stream에서 bbox 위치 검증
- [ ] 16:9, 4:3, narrow viewport에서 overlay 위치 유지 확인

---

### 9. ROS/Camera/AI 실환경 smoke test

**파일**: runtime integration

**현재**
- frontend 연결/재연결 로직은 구현되어 있다.
- 실제 Jetson/rosbridge/camera/backend 조합에서 end-to-end 검증은 별도로 필요하다.

**완료 조건**
- [ ] rosbridge down 상태에서 `rosConnected=false`
- [ ] rosbridge up 후 자동 재연결 및 `rosConnected=true`
- [ ] `/battery_state` 수신 시 TopBar battery 반영
- [ ] `/amcl_pose` 수신 시 pose 저장 및 Alert/History location 반영
- [ ] manual hold 중 `/cmd_vel` 반복 publish 확인
- [ ] hold release/cancel/blur/hidden 시 zero velocity publish 확인
- [ ] E-stop이 연결 상태에서 zero velocity publish 확인
- [ ] AI stream disconnect 후 3초 재연결 확인
- [ ] detection log 3초 throttle 확인

## Low: 문서/spec 정리

### 10. Auto Patrol 제거를 관련 spec에 반영

**파일**: `docs/specs/UI_DETAILS.md`, `docs/specs/API_DETAILS.md`, `docs/specs/IMPLEMENTATION_PHASES.md`, `docs/specs/WIREFRAME_NOTES.md`

**현재**
- 코드에서는 Auto Patrol UI/state가 제거됐다.
- 여러 spec 문서에는 아직 `auto patrol` / `DriveModeControl` 요구가 남아 있다.

**완료 조건**
- [ ] UI/API/phase/wireframe 문서에서 Auto Patrol 제거 또는 Phase 보류로 수정

---

### 11. confidence 단위 문서 통일

**파일**: `README.md`, `docs/AGENTS.md`, `docs/specs/API_DETAILS.md`

**현재**
- 현재 코드는 `confidenceThreshold`를 0-100 기준으로 사용한다.
- 일부 문서에는 `0.5`, `0-1` 기준 표현이 남아 있을 수 있다.

**완료 조건**
- [ ] README threshold 설명 0-100으로 수정
- [ ] docs/AGENTS.md 기본값 50으로 수정
- [ ] API_DETAILS threshold payload 단위 명시

---

### 12. MiniMap Phase 3 보류 명시

**파일**: `src/components/dashboard/MiniMap.tsx`, `docs/specs/IMPLEMENTATION_PHASES.md`, `docs/specs/UI_DETAILS.md`

**현재**
- `MiniMap`은 placeholder다.
- 일부 spec에는 구현 대상처럼 남아 있다.

**완료 조건**
- [ ] Phase 1/2에서는 placeholder 유지라고 명시
- [ ] `/map`, `/amcl_pose`, waypoint, detection marker는 Phase 3 ticket으로 분리

## 권장 작업 순서

1. Jetson/FastAPI CSV append/read smoke test
2. `storagePolicy`를 `useAIStream` 캡처 경로에 연결
3. `CriticalAlarmOverlay` 오디오 알람과 settings 값 연결
4. `AIStatusPanel` FREEZE 버튼 연결
5. `StorageSettings` destructive action 구현 또는 disabled 처리
6. snapshot 실패 상태 표시
7. TopBar latency 구현 또는 spec 조정
8. bbox frame size 계약 정리 및 실환경 위치 검증
9. ROS/Camera/AI end-to-end smoke test
10. 관련 spec 문서 정리

## 검증 체크리스트

- [ ] `npm run build`
- [ ] `npx tsc -b`
- [ ] Jetson/FastAPI CSV append/read smoke test
- [ ] ROS/Camera/AI end-to-end smoke test
- [ ] bbox 실제 stream 위치 검증
- [ ] `storagePolicy === "original"` delayed snapshot skip
- [ ] `storagePolicy === "original+inverted"` delayed snapshot 저장
- [ ] audio alarm toggle/volume이 CriticalAlarmOverlay에 반영
- [ ] FREEZE 버튼 클릭 시 현재 프레임 캡처
- [ ] Storage cleanup 버튼 동작 또는 disabled 상태 확인
