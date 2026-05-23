# Capstone Vision Console

TurtleBot3 모니터링과 RCOD 기반 위장 객체 탐지를 위한 실시간 시각화·제어 UI입니다.

---

> MVP frontend 구현은 완료된 상태입니다. 실환경 연결 전
> [`docs/specs/IMPLEMENT_CHECKLIST.md`](docs/specs/IMPLEMENT_CHECKLIST.md)의
> **ROS 담당자 연동 테스트 체크리스트**를 먼저 확인하세요.
> WebSocket 페이로드 계약, FastAPI 엔드포인트, 현장 검증 항목이 정리되어 있습니다.

---

## 빠른 시작

### 요구사항

- Node.js 18 이상
- npm

### 설치

```bash
git clone https://github.com/yeon17s/capstone-vision-console
cd capstone-vision-console
npm install
```

### 개발 서버 실행

```bash
npm run dev
# http://localhost:5173
```

### 프로덕션 빌드

```bash
npm run build
npm run preview
```

---

## 프로젝트 구조

```
capstone-vision-console/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── AIOverlay.tsx          # bbox 오버레이 (object-cover 보정)
│   │   │   ├── AIStatusPanel.tsx      # FPS / Frame Delay / Confidence / FREEZE
│   │   │   ├── AlertFeed.tsx          # 실시간 Detection 카드 피드
│   │   │   ├── CriticalAlarmOverlay.tsx  # 임계값 초과 시 빨간 테두리 알람
│   │   │   ├── DriveController.tsx    # 방향 버튼 + E-Stop
│   │   │   ├── MiniMap.tsx            # Phase 3 placeholder
│   │   │   └── VideoStream.tsx        # MJPEG 스트림 + 반전 토글
│   │   ├── history/
│   │   │   ├── DetailModal.tsx        # 선택 row 상세 (스냅샷 / 메타데이터)
│   │   │   ├── DetectionTable.tsx     # Detection 이력 테이블
│   │   │   └── FilterBar.tsx          # 검색 / 날짜 / Confidence 필터
│   │   ├── settings/
│   │   │   ├── AIConfig.tsx           # Confidence threshold / Audio alarm
│   │   │   ├── ConnectionForm.tsx     # Robot IP / Rosbridge Port / Backend URL
│   │   │   ├── DiagnosticsMonitor.tsx # 연결 상태 진단 패널
│   │   │   └── StorageSettings.tsx    # Storage policy 선택
│   │   └── ui/                        # 공통 UI 컴포넌트 (Button, Typography 등)
│   ├── hooks/
│   │   ├── useAIStream.ts             # AI WebSocket 연결 / 재연결 / Detection log
│   │   ├── useAlarmSound.ts           # Detection 발생 시 오디오 알람
│   │   ├── useFastapiPing.ts          # FastAPI /ping 폴링 및 latency 측정
│   │   ├── useRosConnection.ts        # ROS Bridge 연결 / battery / pose 구독
│   │   └── useVideoCapture.ts         # canvas 기반 프레임 캡처
│   ├── lib/
│   │   ├── confidenceTone.ts          # confidence → UI tone 변환 유틸
│   │   ├── cx.ts                      # className 병합 유틸
│   │   ├── historyApi.ts              # FastAPI history append / fetch
│   │   └── rosClient.ts               # ROS /cmd_vel publish
│   ├── pages/
│   │   ├── Dashboard.tsx              # 카메라 + AI 상태 + 드라이브 제어
│   │   ├── History.tsx                # Detection 이력 조회 / 필터
│   │   └── Settings.tsx               # 연결 설정 / 진단 / AI 설정
│   ├── store/
│   │   ├── robotStore.ts              # ROS 연결·Detection·로그 상태 (Zustand)
│   │   └── settingsStore.ts           # 사용자 설정 + localStorage 영속성
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── docs/
│   ├── AGENTS.md                      # 구현 규칙 및 상태 계약
│   └── specs/
│       ├── IMPLEMENT_CHECKLIST.md     # 구현 점검 및 연동 테스트 체크리스트
│       ├── API_DETAILS.md             # API 명세
│       ├── IMPLEMENTATION_PHASES.md   # 구현 단계별 목표
│       ├── UI_DETAILS.md              # UI 상세
│       └── WIREFRAME_NOTES.md         # 와이어프레임
├── public/
│   └── sounds/
│       └── alarm.mp3                  # Detection 알람 사운드
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 외부 시스템 연동

Settings 페이지에서 아래 값을 설정합니다. 설정은 `localStorage`에 자동 저장됩니다.

| 항목 | 기본값 | 설명 |
|------|--------|------|
| Robot IP | `192.168.0.45` | Jetson 보드 IP |
| Rosbridge Port | `9090` | ROS Bridge WebSocket 포트 |
| Backend URL | `http://121.156.245.81:8000` | FastAPI 서버 주소 |

연동 대상:

| 대상 | 주소 형식 | 용도 |
|------|-----------|------|
| MJPEG stream | `http://<jetsonIp>:8080/stream?topic=/cv_camera/image_raw` | Dashboard 영상 표시 |
| ROS Bridge | `ws://<jetsonIp>:<rosbridgePort>` | 배터리/pose 구독, `/cmd_vel` 발행 |
| AI WebSocket | `ws://<jetsonIp>:8000/ws/ai_stream` | Detection payload 수신 |
| FastAPI | `<fastapiUrl>` | ping latency, history append/fetch |

---

## API 엔드포인트

### 카메라 스트림 (MJPEG)

```
GET http://<jetsonIp>:8080/stream?topic=/cv_camera/image_raw
```

### ROS Bridge

```
ws://<jetsonIp>:<rosbridgePort>
```

구독 토픽:
- `/battery_state` (`sensor_msgs/BatteryState`) — TopBar 배터리 표시
- `/amcl_pose` (`geometry_msgs/PoseWithCovarianceStamped`) — Detection location 기록

발행 토픽:
- `/cmd_vel` (`geometry_msgs/Twist`) — 방향 버튼 hold 시 150ms 간격 publish, release 시 zero velocity

### AI WebSocket

```
ws://<jetsonIp>:8000/ws/ai_stream
```

백엔드 송신 형식:

```json
{
  "timestamp": "2026-05-23T12:00:00.000000",
  "class": "person",
  "confidence": 87.3,
  "bbox": { "x": 120, "y": 80, "w": 200, "h": 300 },
  "fps": 25.0,
  "frame_delay_ms": 45,
  "frame_width": 640,
  "frame_height": 480
}
```

- `confidence`: **0–100 퍼센트 스케일** (0–1 아님)
- `class`: `"person"` 또는 `"none"`
- `frame_width` / `frame_height`: 생략 시 640×480 fallback
- `bbox`: `frame_width` × `frame_height` 기준 좌표

### FastAPI

```
GET  <fastapiUrl>/ping
GET  <fastapiUrl>/api/history
POST <fastapiUrl>/api/history/log
```

- `GET /ping` — 200 OK 시 TopBar FastAPI 지시등 Connected + latency 표시
- `GET /api/history` — History 페이지 진입 시 자동 호출, CSV 전체 조회
- `POST /api/history/log` — Detection 발생 시 frontend가 자동 호출 (네트워크 단절 시 localStorage pending queue에 보관 후 재연결 시 drain)

History row는 CSV 저장을 위한 flat JSON 형식입니다. `snapshot_status`는 원본 snapshot 캡처 여부를 나타내며 `"captured"` 또는 `"unavailable"` 값을 사용합니다.

---

## 상태 관리 (Zustand)

### robotStore

```typescript
{
  rosConnected: boolean;       // ROS Bridge 연결 상태
  aiConnected: boolean;        // AI WebSocket 연결 상태
  cameraConnected: boolean;    // 카메라 스트림 상태
  fastapiConnected: boolean;   // FastAPI 연결 상태
  batteryPercent: number;      // 배터리 (0–100)
  latencyMs: number | null;    // FastAPI ping 왕복 시간 (null = 미측정)
  pose: { x, y, yaw };        // 로봇 위치
  detection: {
    class: string;             // "person" | "none"
    confidence: number;        // 0–100
    bbox: { x, y, w, h };
    fps: number;
    frameDelayMs: number;
  };
  recentLog: DetectionLogEntry[];   // 세션 내 최근 50건 (AlertFeed 소스)
  historyLog: DetectionLogEntry[];  // CSV + 세션 병합 전체 이력 (History 소스)
}
```

### settingsStore

```typescript
{
  jetsonIp: string;                            // 기본값: "192.168.0.45"
  rosbridgePort: number;                       // 기본값: 9090
  fastapiUrl: string;                          // 기본값: "http://121.156.245.81:8000"
  confidenceThreshold: number;                 // 0–100 (기본값: 50)
  audioAlarmEnabled: boolean;                  // 기본값: true
  volume: number;                              // 0–100 (기본값: 70)
  storagePolicy: "original" | "original+inverted";  // 기본값: "original"
  frameWidth: number;                          // AI 소스 프레임 가로 (기본값: 640)
  frameHeight: number;                         // AI 소스 프레임 세로 (기본값: 480)
}
```

---

## 기술 스택

| 분류 | 사용 기술 |
|------|-----------|
| Frontend | React 18 + TypeScript |
| 상태 관리 | Zustand |
| 스타일링 | Tailwind CSS |
| 빌드 | Vite |
| ROS 연동 | roslib |

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| [IMPLEMENT_CHECKLIST.md](docs/specs/IMPLEMENT_CHECKLIST.md) | 연동 테스트 체크리스트 (ROS 담당자용 포함) |
| [AGENTS.md](docs/AGENTS.md) | 구현 규칙 및 상태 계약 |
| [API_DETAILS.md](docs/specs/API_DETAILS.md) | API 명세 상세 |
| [IMPLEMENTATION_PHASES.md](docs/specs/IMPLEMENTATION_PHASES.md) | 구현 단계별 목표 |
