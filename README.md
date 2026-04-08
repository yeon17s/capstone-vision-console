# 🤖 Capstone Vision Console

TurtleBot3 모니터링 및 RCOD 기반 위장 객체 탐지를 위한 실시간 시각화 및 제어 UI

**현재 상태:** MVP 구현 중 (로봇/AI 팀 통합 대기)

---

## 📋 빠른 시작

### 1️⃣ 설치

```bash
# 저장소 클론
git clone <https://github.com/yeon17s/capstone-vision-console>
cd capstone-vision-console

# 의존성 설치
npm install
```

### 2️⃣ 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 에 접속

### 3️⃣ 프로덕션 빌드

```bash
npm run build
npm run preview
```

---

## 🏗️ 프로젝트 구조

```
capstone-vision-console/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── dashboard/       # Dashboard 페이지 컴포넌트
│   │   ├── history/         # History 페이지 컴포넌트
│   │   ├── settings/        # Settings 페이지 컴포넌트
│   │   └── ui/              # 공통 UI 컴포넌트
│   ├── hooks/               # Custom React hooks
│   │   ├── useRosConnection.ts    # ROS Bridge 연결
│   │   ├── useAIStream.ts         # AI WebSocket 스트림
│   │   └── useBattery.ts          # 배터리 정보
│   ├── lib/
│   │   └── rosClient.ts           # ROS 클라이언트 관리
│   ├── store/               # Zustand 상태 관리
│   │   ├── robotStore.ts          # 로봇 상태
│   │   └── settingsStore.ts       # 설정 상태
│   ├── pages/               # 페이지 컴포넌트
│   │   ├── Dashboard.tsx
│   │   ├── History.tsx
│   │   └── Settings.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── docs/
│   ├── AGENTS.md                           # 구현 규칙
│   └── specs/
│       ├── API_DETAILS.md                  # API 명세
│       ├── IMPLEMENTATION_PHASES.md        # 구현 단계
│       ├── UI_DETAILS.md                   # UI 상세
│       └── WIREFRAME_NOTES.md              # 와이어프레임
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 🔌 외부 시스템 연동

### 필수 설정 (Settings 페이지)

**Connection Form:**
- **Robot IP**: TurtleBot Jetson 보드 IP (기본값: `192.168.0.45`)
- **Rosbridge Port**: ROS Bridge WebSocket 포트 (기본값: `9090`)
- **Backend URL**: FastAPI 백엔드 주소 (기본값: `http://121.156.245.81:8000`)

설정은 자동으로 `localStorage` 에 저장됩니다.

---

## 로컬 테스트 방법

### 🤖 로봇

#### Step 1: Jetson에서 web_video_server 실행
```bash
# Jetson에서
roslaunch web_video_server web_video_server.launch
# http://{jetson-ip}:8080/stream?topic=/cv_camera/image_raw 에서 스트림 확인
```

#### Step 2: Console Settings에서 Robot IP 설정
1. Settings 페이지 → "System & Network Configuration"
2. Robot IP 입력 (예: `192.168.0.45`)
3. "Save & Apply" 클릭

#### Step 3: 카메라 스트림 확인
- Dashboard 페이지의 비디오 영역에서 카메라 스트림 표시 확인

#### Step 4: ROS 연결 테스트
현재는 수동으로 다음을 구현해야 합니다:

```typescript
// src/hooks/useRosConnection.ts 에서 구현 필요
// 1. ROS Bridge WebSocket 연결
const ros = new ROS({
  url: `ws://${jetsonIp}:${rosbridgePort}`
});

// 2. /battery_state 구독
const batteryListener = new ROSLIB.Topic({
  ros: ros,
  name: '/battery_state',
  messageType: 'sensor_msgs/BatteryState'
});
batteryListener.subscribe((message) => {
  robotStore.setBatteryPercent(message.percentage * 100);
});

// 3. /cmd_vel 발행
const cmdVel = new ROSLIB.Topic({
  ros: ros,
  name: '/cmd_vel',
  messageType: 'geometry_msgs/Twist'
});
```

---


### 🧠 AI

#### Step 1: FastAPI 백엔드 실행
```bash
# Jetson 또는 별도 서버에서
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Step 2: Console Settings에서 Backend URL 설정
1. Settings 페이지 → "System & Network Configuration"
2. Backend URL 입력 (예: `http://121.156.245.81:8000`)
3. "Save & Apply" 클릭

#### Step 3: AI 스트림 테스트
현재는 수동으로 다음을 구현해야 합니다:

```typescript
// src/hooks/useAIStream.ts 에서 구현 필요
const useAIStream = () => {
  const { updateSettings } = useSettingsStore();
  const { setDetection, pushDetectionLog } = useRobotStore();

  useEffect(() => {
    const aiWsUrl = `ws://${jetsonIp}:8000/ws/ai_stream`;
    const ws = new WebSocket(aiWsUrl);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      // 메시지 파싱 (스키마 확인 후)
      const detection = {
        class: message.class,
        confidence: message.confidence,
        bbox: message.bbox,
        fps: message.fps,
        frameDelayMs: message.frame_delay_ms
      };

      // 임계값 필터링
      if (message.confidence >= (confidenceThreshold * 100)) {
        setDetection(detection);
        pushDetectionLog({
          ...detection,
          timestamp: new Date().toISOString()
        });
      } else {
        setDetection({ ...detection, class: 'none' });
      }
    };

    return () => ws.close();
  }, []);
};
```

---

## 📊 상태 관리 (Zustand)

### robotStore
```typescript
{
  rosConnected: boolean;        // ROS Bridge 연결 상태
  aiConnected: boolean;         // AI WebSocket 연결 상태
  cameraConnected: boolean;     // 카메라 스트림 상태
  driveMode: "manual" | "auto"; // 드라이브 모드
  batteryPercent: number;       // 배터리 (0-100)
  pose: { x, y, yaw };         // 로봇 위치 및 회전
  detection: {
    class: string;              // 감지 클래스 (또는 "none")
    confidence: number;         // 신뢰도 (0-100)
    bbox: { x, y, w, h };      // 바운딩박스
    fps: number;               // 프레임률
    frameDelayMs: number;      // 프레임 지연
  };
  detectionLog: [];            // 감지 이력 (최대 50개)
}
```

### settingsStore
```typescript
{
  jetsonIp: string;                    // 기본값: "192.168.0.45"
  rosbridgePort: number;               // 기본값: 9090
  fastapiUrl: string;                  // 기본값: "http://121.156.245.81:8000"
  confidenceThreshold: number;         // 0-1 (기본값: 0.5)
  audioAlarmEnabled: boolean;          // 기본값: true
  volume: number;                      // 0-100 (기본값: 70)
  storagePolicy: "original" | "original+inverted"; // 기본값: "original"
}
```

---

## 📝 API 엔드포인트

### MJPEG 스트림
```
GET http://<jetsonIp>:8080/stream?topic=/cv_camera/image_raw
```

### ROS Bridge
```
ws://<jetsonIp>:9090
```

### AI WebSocket
```
ws://<jetsonIp>:8000/ws/ai_stream
```

### FastAPI
```
GET  http://<fastapiUrl>/ping
GET  http://<fastapiUrl>/api/history
GET  http://<fastapiUrl>/api/settings/threshold
POST http://<fastapiUrl>/api/settings/threshold
```

---

## 🔗 관련 문서

| 문서 | 설명 |
|------|------|
| [AGENTS.md](docs/AGENTS.md) | 구현 규칙 & 상태 계약 |
| [API_DETAILS.md](docs/specs/API_DETAILS.md) | API 명세 |
| [IMPLEMENTATION_PHASES.md](docs/specs/IMPLEMENTATION_PHASES.md) | 구현 단계별 목표 |

---

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **상태 관리**: Zustand
- **스타일링**: Tailwind CSS
- **빌드**: Vite
- **ROS**: roslibjs (미설치, 필요 시 `npm install roslibjs`)

