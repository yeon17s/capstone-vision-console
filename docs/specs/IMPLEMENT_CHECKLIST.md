# 구현 점검 리스트 (Implementation Checklist)

> 기준일: 2026-05-28
>
> 현재 워크트리 기준으로 MVP 구현 상태와 실환경 연동 검증 항목을 추적한다.

---

## ROS 담당자 연동 테스트 체크리스트

> **이 섹션을 먼저 확인하세요.**
>
> MVP frontend는 구현 완료 상태입니다. 아래 항목은 Jetson / rosbridge / FastAPI 실환경 연결 시 담당자가 직접 검증해야 하는 항목입니다.
> 검증 전 Settings 페이지에서 Robot IP, Rosbridge Port, Backend URL을 현장 환경에 맞게 설정하세요.

### ROS Bridge

- [ ] rosbridge down 상태에서 TopBar ROS 지시등 `Disconnected` 표시
- [ ] rosbridge 기동 후 자동 재연결 및 TopBar ROS 지시등 `Connected` 전환
- [ ] `/battery_state` 수신 시 TopBar Battery 퍼센트 실시간 반영
- [ ] `/amcl_pose` 수신 시 Detection log의 Location 컬럼에 X/Y 좌표 표시

### Drive Control

- [ ] Manual 방향 버튼 hold 중 `/cmd_vel` 150ms 간격 반복 publish 확인
- [ ] 버튼 release / 탭 전환 / 브라우저 blur 시 zero velocity (`lx=0, az=0`) publish 확인
- [ ] E-Stop 클릭 시 zero velocity publish + "STOP SENT" 피드백 표시
- [ ] E-Stop 클릭 시 진행 중 Auto Scan 즉시 취소 확인
- [ ] rosbridge 연결 끊김 시 드라이브 버튼 disabled + "ROS DISCONNECTED" 표시

### AI WebSocket (`ws://<jetsonIp>:8000/ws/ai_stream`)

- [ ] AI 연결 시 TopBar AI 지시등 `Live` 전환
- [ ] `person` 클래스 수신 시 Dashboard 비디오 위 bbox overlay 표시
- [ ] `person` 클래스 수신 시 CriticalAlarmOverlay (빨간 테두리) 활성화
- [ ] Detection confidence가 Settings 임계값 미만일 때 alarm 미발생 확인
- [ ] AI stream 단절 후 3초 내 자동 재연결 시도 확인
- [ ] `frame_width` / `frame_height` 변경 시 bbox overlay 크기 자동 보정 확인

### Auto Scan

- [ ] Settings → AI Config에서 Auto Scan On 설정 후 person 탐지(confidence ≥ threshold) 시 로봇이 좌→우→복귀 스캔 동작 수행 (약 8초)
- [ ] 각 스캔 구간에서 `/cmd_vel` 150ms 간격 반복 publish 확인 (ROS watchdog 대응)
- [ ] E-Stop 클릭 시 진행 중 스캔 타이머 즉시 취소 + 정지 명령 확인
- [ ] Auto Scan Off 전환 시 진행 중 스캔 즉시 중단 확인
- [ ] 15초 쿨다운 중 재탐지 시 스캔 중복 실행 없음 확인
- [ ] ROS 미연결 상태에서 Auto Scan 동작하지 않음 확인

### AI WebSocket 페이로드 계약

백엔드는 아래 JSON 형식을 송신해야 합니다:

```json
{
  "timestamp": "2026-05-23T12:00:00.000000",
  "class": "person",
  "confidence": 87.3,
  "bbox": { "x": 120, "y": 80, "w": 200, "h": 300 },
  "fps": 25.0,
  "frame_delay_ms": 45,
  "frame_width": 640,
  "frame_height": 480,
  "snapshot_url": "http://..."
}
```

- `confidence`: **0–100 퍼센트 스케일** (0–1 아님)
- `frame_width` / `frame_height`: 생략 시 640×480으로 fallback
- `bbox`: `frame_width` × `frame_height` 기준 좌표
- `class`: `"person"` 또는 `"none"` 이외 값은 `"none"` 처리
- `snapshot_url`: optional 문자열 — 백엔드가 스냅샷을 저장한 경우에만 포함, 없으면 생략. `snapshot_url` 없는 `person` 탐지는 History 로그에 기록되지 않음

### FastAPI (`<fastapiUrl>`)

- [ ] `GET /ping` → 200 OK 응답 → TopBar FastAPI 지시등 `Connected` + latency ms 표시
- [ ] `POST /api/history/log` → history DB row append 확인 (payload 형식은 아래 참조)
- [ ] `GET /api/history` → 최근 200건 history row JSON 조회 → History 페이지 로드 시 자동 merge
- [ ] `GET /api/history/count` → DB 전체 건수 반환 (`{ "total": N }`) → 200 초과 시 테이블 footer에 `+N logs` 표시 확인
- [ ] `DELETE /api/history` → DB 전체 삭제 + snapshots/ 파일 삭제 → frontend historyLog·recentLog·pending queue 초기화 확인
- [ ] `POST /api/settings/threshold` → Confidence Threshold 변경 시 백엔드 적용 확인 (Settings 슬라이더 500ms 후 자동 호출, body: `{ "threshold": 50 }`, backend 내부 0–1 값으로 변환)
- [ ] 네트워크 단절 후 복구 시 frontend pending queue가 순서대로 drain되는지 확인

`POST /api/history/log` payload는 DB 저장을 위한 flat JSON 형식입니다:

```json
{
  "timestamp": "2026-05-23T12:00:00.000000",
  "confidence": 87.3,
  "bbox_x": 120, "bbox_y": 80, "bbox_w": 200, "bbox_h": 300,
  "fps": 25.0,
  "frame_delay_ms": 45,
  "pose_x": 1.23, "pose_y": -0.45, "pose_yaw": 0.78,
  "snapshot_url": "http://..."
}
```

`GET /api/history` response (JSON array):

```json
[
  {
    "timestamp": "2026-05-23T12:00:00.000000",
    "confidence": 87.3,
    "bbox_x": 120, "bbox_y": 80, "bbox_w": 200, "bbox_h": 300,
    "fps": 25.0,
    "frame_delay_ms": 45,
    "pose_x": 1.23, "pose_y": -0.45, "pose_yaw": 0.78,
    "snapshot_url": "http://..."
  }
]
```

- `snapshot_url`: optional 문자열 — 스냅샷 없는 경우 생략 또는 `null`
- History row는 frontend에서 최신순으로 정렬해 표시합니다.

### bbox overlay 위치 검증

- [ ] 실제 스트림에서 bbox가 객체 위에 정확히 표시되는지 확인
- [ ] 16:9 / 4:3 등 다른 비율 화면에서 overlay 위치 유지 확인

---

## 현재 구현 상태 요약

상태 표기:

- ✅ 구현 완료: frontend 구현 완료, 코드 레벨 동작 확인
- ⏸ 보류: MVP 범위 밖이거나 후속 phase 예정
- 실환경 smoke test 필요: Jetson / rosbridge / FastAPI 연결 환경에서 직접 확인 필요

| 영역 | 상태 | 비고 |
|------|------|------|
| ROS Bridge 연결/재연결 | ✅ 구현 완료 | 실환경 smoke test 필요 |
| `/battery_state` 구독 | ✅ 구현 완료 | 실환경 smoke test 필요 |
| `/amcl_pose` 구독 | ✅ 구현 완료 | 실환경 smoke test 필요 |
| `/cmd_vel` hold publish | ✅ 구현 완료 | 실환경 smoke test 필요 |
| E-Stop feedback | ✅ 구현 완료 | 실환경 smoke test 필요 |
| Auto Scan (탐지 시 자동 좌우 스캔) | ✅ 구현 완료 | 실환경 ROS 연결 상태에서 동작 검증 필요 |
| AI WebSocket 연결/재연결 | ✅ 구현 완료 | 실환경 smoke test 필요 |
| bbox overlay (object-cover 보정) | ✅ 구현 완료 | 실제 stream bbox 위치 검증 필요 |
| Detection log (throttle 3초) | ✅ 구현 완료 | — |
| Snapshot 저장 (백엔드) | ✅ 구현 완료 | snapshot_url Host 기반 동적 생성. CORS 환경 검증 필요 |
| Audio alarm | ✅ 구현 완료 | — |
| FREEZE 버튼 | ✅ 구현 완료 | — |
| FastAPI ping / latency | ✅ 구현 완료 | — |
| History DB append/fetch | ✅ 구현 완료 | 실환경 smoke test 필요 |
| History CSV 내보내기 (Export) | ✅ 구현 완료 | — |
| Confidence Threshold 백엔드 동기화 | ✅ 구현 완료 | 프론트 0–100 → 백엔드 내부 0–1 변환 포함 |
| Pending queue drain | ✅ 구현 완료 | 실환경 네트워크 단절 검증 필요 |
| StorageSettings — Clear Local Cache | ✅ 구현 완료 | localStorage 설정값·FP overrides 초기화 |
| StorageSettings — Delete All Data | ✅ 구현 완료 | DELETE /api/history + frontend 상태 전체 초기화. 실환경 smoke test 필요 |
| History totalCount (+N logs footer) | ✅ 구현 완료 | GET /api/history/count 연동. 실환경 smoke test 필요 |
| MiniMap | ⏸ placeholder | Phase 3 보류 |

---

## 검증 최종 체크리스트

빌드/타입:

- [ ] `npm run build` 오류 없음
- [ ] `npx tsc -b` 오류 없음

실환경:

- [ ] Jetson rosbridge 자동 재연결
- [ ] `/battery_state` TopBar 반영
- [ ] `/amcl_pose` History Location 반영
- [ ] `/cmd_vel` hold publish + release zero velocity
- [ ] E-Stop zero velocity publish
- [ ] E-Stop 클릭 시 Auto Scan 즉시 취소
- [ ] Auto Scan On → person 탐지 → 좌우 스캔 동작
- [ ] AI WebSocket 3초 재연결
- [ ] Detection throttle 3초 확인
- [ ] bbox 실제 stream 위치 검증
- [ ] `POST /api/history/log` DB append
- [ ] `GET /api/history` 조회 및 History 페이지 merge
- [ ] `POST /api/settings/threshold` 호출 확인 (Settings 슬라이더 조작 후)
- [ ] Pending queue drain (백엔드 재시작 후)
- [ ] Audio alarm on/off 및 volume 반영
- [ ] FREEZE 버튼 캡처 동작
