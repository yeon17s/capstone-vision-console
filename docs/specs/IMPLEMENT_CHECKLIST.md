# 구현 점검 리스트 (Implementation Checklist)

현재 구현 상태와 문서 스펙을 비교하여 작성된 수정 필요 항목 목록입니다.

---

## 🔴 높은 우선순위 (Critical)

### 1. useAIStream.ts - AI WebSocket 구현 누락
**파일**: `src/hooks/useAIStream.ts`  
**현재**: 완전히 비어있음  
**필요**: 
- `ws://<jetsonIp>:8000/ws/ai_stream` 연결 구현
- JSON 메시지 수신 파싱:
  ```json
  {
    "timestamp": "2026-03-29T19:30:00.123456",
    "class": "person",
    "confidence": 85.5,
    "bbox": { "x": 150, "y": 120, "w": 80, "h": 140 },
    "fps": 20.5,
    "frame_delay_ms": 48
  }
  ```
- `robotStore.setDetection()` 호출로 상태 업데이트
- `class === "person" | "none"` 검증
- 연결 상태 추적 (`robotStore.setConnectionStatus('aiConnected', ...)`)

**영향**: AI 기능 전체가 동작하지 않음

---

### 2. robotStore.ts - Confidence 범위 오류
**파일**: `src/store/robotStore.ts`  
**현재**: 
```typescript
confidence: number;  // 0–1 (주석)
```
**필요**: 
```typescript
confidence: number;  // 0–100 (percent scale)
```
**이유**: 
- 문서와 API 스펙에서 `0-100` 범위로 명시
- 모든 confidence 표시 로직에 영향 (AIStatusPanel, DetailModal, AlertFeed 등)

**해결 방법**:
- Store에서 0-100 범위로 저장
- 모든 계산 및 표시 로직 수정

---

### 3. settingsStore.ts - Threshold 범위 표준화
**파일**: `src/store/settingsStore.ts`  
**현재**: 
```typescript
confidenceThreshold: 0.5,  // 범위 불명확
```
**필요**: 
```typescript
confidenceThreshold: number;  // 0-100 범위로 표준화 후 명시
```

**확인 필요**: 
- 백엔드 AI 팀과의 threshold 범위 합의 (0-1 vs 0-100)
- robotStore.confidence 범위와 일치하도록 통일

---

## 🔴 높은 우선순위 (High)

### 4. AIStatusPanel.tsx - Frame Delay 임계값 수정
**파일**: `src/components/dashboard/AIStatusPanel.tsx`  
**위치**: 라인 12-22  
**현재**: 
```typescript
if (frameDelayMs <= 60) return "text-mission-active";      // 초록
if (frameDelayMs <= 120) return "text-mission-suspicious";  // 노랑
return "text-mission-critical";                             // 빨강
```
**필요**: 
```typescript
if (frameDelayMs <= 200) return "text-mission-active";      // 초록
if (frameDelayMs <= 500) return "text-mission-suspicious";  // 노랑
return "text-mission-critical";                             // 빨강
```

**문서 기준**: 
- 0–200ms: green (normal)
- 200–500ms: yellow (warning)
- 500ms+: red (critical)

---

### 5. AIStatusPanel.tsx - 하드코딩된 값 제거
**파일**: `src/components/dashboard/AIStatusPanel.tsx`  
**위치**: 라인 34 (및 다른 하드코딩 값들)  
**현재**: 
```typescript
const frameDelayMs = 48;  // 하드코딩
```
**필요**: 
```typescript
const detection = useRobotStore((s) => s.detection);
const driveMode = useRobotStore((s) => s.driveMode);
// detection.frameDelayMs, detection.confidence, detection.class 등 사용
```

**수정 항목**:
- Last Detected class → `detection.class`
- Confidence → `detection.confidence`
- Frame Delay → `detection.frameDelayMs`
- FPS → `detection.fps`
- Current Mode → `driveMode`
- Visual Mode → 현재 선택된 모드

---

### 6. AIOverlay.tsx - 동적 데이터 연결
**파일**: `src/components/dashboard/AIOverlay.tsx`  
**현재**: 
```typescript
<div className="absolute left-[22%] top-[16%] bottom-[18%] w-[110px]">
  <Typography>Person | 98.5%</Typography>
</div>
```
**필요**: 
- `robotStore.detection` 에서 실시간 데이터 가져오기
- Bbox 동적 위치 계산 (detection.bbox 기반)
- Class와 confidence 동적 표시
- Canvas 기반 렌더링 또는 동적 스타일링

**추가 고려사항**:
- `detection.class === "none"` 일 때 bbox 숨김 (캔버스는 유지)
- Confidence 값의 0-100 범위 확인

---

### 7. DetailModal.tsx - False Positive 버튼 제거 (MVP)
**파일**: `src/components/history/DetailModal.tsx`  
**위치**: 라인 96-105  
**현재**: 
```typescript
{!isFalsePositive && (
  <Button
    onClick={onMarkFalsePositive}
    variant="dangerOutline"
    size="sm"
  >
    <Typography as="span" variant="overline" tone="danger" className="font-bold">
      False Positive
    </Typography>
  </Button>
)}
```
**필요**: 버튼 제거  
**이유**: Phase 2 기능 (MVP에는 제외)

---

### 8. DetailModal.tsx - Confidence 계산 수정
**파일**: `src/components/history/DetailModal.tsx`  
**위치**: 라인 40-66 (ConfidenceDonut 컴포넌트)  
**현재**: 
```typescript
const pct = conf * 100;  // 0-1 범위 가정
```
**필요**: 
```typescript
const pct = conf;  // 이미 0-100 범위
// 또는 타입에 따라 조정
```

**확인**: robotStore.confidence 범위 통일 후 처리

---

### 9. DetailModal.tsx - Frame Delay 임계값 수정
**파일**: `src/components/history/DetailModal.tsx`  
**위치**: 라인 132  
**현재**: 
```typescript
entry.frameDelayMs <= 60 ? "success" : entry.frameDelayMs <= 120 ? "warning" : "danger"
```
**필요**: 
```typescript
entry.frameDelayMs <= 200 ? "success" : entry.frameDelayMs <= 500 ? "warning" : "danger"
```

---

### 10. DetailModal.tsx - 이미지 비교 명시
**파일**: `src/components/history/DetailModal.tsx`  
**위치**: 라인 141-161  
**현재**: 
```typescript
<Typography>A. Original<br />Photo</Typography>
<Typography>B. Inverted<br />Photo</Typography>
```
**필요**: 
```typescript
<Typography>Original<br />(Detection Moment)</Typography>
<Typography>Inverted<br />(Detection Moment)</Typography>
```

**추가**: 실제 캡처된 이미지 URL/src 연결 필요

---

### 11. AlertFeed.tsx - Mock 데이터 수정
**파일**: `src/components/dashboard/AlertFeed.tsx`  
**위치**: 라인 14-19  
**현재**: 
```typescript
const MOCK_ALERTS: AlertItem[] = [
  { id: 1, cls: "person", conf: 98.5, ... },
  { id: 2, cls: "person", conf: 91.2, ... },
  { id: 3, cls: "dog",    conf: 76.4, ... },  // ❌ 제거 필요
  { id: 4, cls: "person", conf: 88.9, ... },
];
```
**필요**: "dog" 항목 제거  
**이유**: 문서에서 "person"만 허용 (multiclass는 June Phase 2)

---

### 12. AlertFeed.tsx - 실제 데이터 연결
**파일**: `src/components/dashboard/AlertFeed.tsx`  
**현재**: MOCK_ALERTS 사용  
**필요**: 
```typescript
const detectionLog = useRobotStore((s) => s.detectionLog);
// detectionLog를 렌더링하도록 변경
// 실시간 detection 이벤트 시 업데이트
```

---

## 🟡 중간 우선순위 (Medium)

### 13. VideoStream.tsx - Spacebar Visual Mode Toggle
**파일**: `src/components/dashboard/VideoStream.tsx`  
**위치**: 라인 24-26  
**현재**: UI 텍스트만 있음  
**필요**: 
- Spacebar 키 이벤트 리스너 추가
- `filter: invert(1)` CSS 토글 구현
- 상태 관리 (settingsStore 또는 로컬 state)

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      // invert mode toggle
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

### 14. VideoStream.tsx - Freeze-frame Capture 구현
**파일**: `src/components/dashboard/VideoStream.tsx`  
**필요**: 
- `<img>` 태그에서 canvas `toDataURL()` 로 스냅샷 추출
- 탐지 시점에 첫 번째 스냅샷 저장
- 탐지 후 1~2초에 두 번째 스냅샷 저장
- 두 이미지 robotStore에 저장 (또는 별도 상태 관리)

```typescript
// 검출 발생 시 (useEffect로 감시)
const captureSnapshot = () => {
  const canvas = document.createElement('canvas');
  const img = videoRef.current as HTMLImageElement;
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
};
```

---

### 15. CriticalAlarmOverlay.tsx - 조건 로직 추가
**파일**: `src/components/dashboard/CriticalAlarmOverlay.tsx`  
**위치**: 라인 1-9  
**현재**: 항상 렌더링  
**필요**: 
```typescript
export default function CriticalAlarmOverlay() {
  const detection = useRobotStore((s) => s.detection);
  const threshold = useSettingsStore((s) => s.confidenceThreshold);
  
  // confidence >= threshold 일 때만 표시
  if (detection.class === "none" || detection.confidence < threshold) {
    return null;
  }
  
  return (
    <div className="pointer-events-none absolute inset-[6px] animate-pulse ...">
      ...
    </div>
  );
}
```

---

### 16. Dashboard.tsx - CriticalAlarmOverlay 활성화
**파일**: `src/pages/Dashboard.tsx`  
**위치**: 라인 4, 20  
**현재**: 주석처리  
**필요**: 활성화 (조건 로직 추가 후)

```typescript
// import CriticalAlarmOverlay from "../components/dashboard/CriticalAlarmOverlay";
// ↓
import CriticalAlarmOverlay from "../components/dashboard/CriticalAlarmOverlay";

// <CriticalAlarmOverlay /> 
// ↓
<CriticalAlarmOverlay />
```

---

## 🟡 중간 우선순위 (Medium) - 추가 검토 필요

### 17. History.tsx - 상태 관리 및 필터 로직
**파일**: `src/pages/History.tsx`  
**확인 필요**:
- DetectionTable이 실제 `detectionLog` 와 연결되었는지
- FilterBar 필터가 적용되는지
- DetailModal 선택 상태 관리
- False Positive 마킹 로직 (현재는 있는데 MVP에서 제거 필요)

---

### 18. MiniMap.tsx - ROS 연결
**파일**: `src/components/dashboard/MiniMap.tsx`  
**확인 필요**:
- `/map` 토픽 구독
- `/amcl_pose` 로부터 로봇 위치 표시
- Detection 마커 표시

---

### 19. DriveController.tsx - 제어 로직
**파일**: `src/components/dashboard/DriveController.tsx`  
**확인 필요**:
- E-stop 우선순위 구현
- `/cmd_vel` 퍼블리시
- Drive mode 토글 동작

---

### 20. ConnectionForm.tsx - 설정 관리
**파일**: `src/components/settings/ConnectionForm.tsx`  
**확인 필요**:
- settingsStore 연결
- 설정 저장/로드
- Hydration

---

### 21. DiagnosticsMonitor.tsx - 헬스체크
**파일**: `src/components/settings/DiagnosticsMonitor.tsx`  
**확인 필요**:
- ROS bridge 헬스체크
- FastAPI 헬스체크 (`GET /ping`)
- Camera 연결 상태

---

## 📊 우선순위 요약

| 우선순위 | 항목 | 파일 | 예상 복잡도 |
|---------|------|------|-----------|
| 🔴 Critical | useAIStream 구현 | useAIStream.ts | 높음 |
| 🔴 Critical | robotStore confidence 범위 | robotStore.ts | 중간 |
| 🔴 Critical | settingsStore threshold | settingsStore.ts | 낮음 |
| 🔴 High | AIStatusPanel frame_delay 기준 | AIStatusPanel.tsx | 낮음 |
| 🔴 High | AIStatusPanel 동적 데이터 | AIStatusPanel.tsx | 중간 |
| 🔴 High | AIOverlay 동적 데이터 | AIOverlay.tsx | 높음 |
| 🔴 High | DetailModal False Positive 제거 | DetailModal.tsx | 낮음 |
| 🔴 High | DetailModal 범위/임계값 수정 | DetailModal.tsx | 낮음 |
| 🔴 High | DetailModal 이미지 연결 | DetailModal.tsx | 중간 |
| 🔴 High | AlertFeed 데이터 정리 | AlertFeed.tsx | 낮음 |
| 🔴 High | AlertFeed 실제 데이터 | AlertFeed.tsx | 중간 |
| 🟡 Medium | VideoStream spacebar toggle | VideoStream.tsx | 낮음 |
| 🟡 Medium | VideoStream freeze-frame | VideoStream.tsx | 높음 |
| 🟡 Medium | CriticalAlarmOverlay 조건 | CriticalAlarmOverlay.tsx | 낮음 |
| 🟡 Medium | Dashboard 활성화 | Dashboard.tsx | 낮음 |
| 🟡 Medium | 기타 컴포넌트 검토 | 여러 파일 | 미정 |

---

## 📝 작업 순서 권장

1. **useAIStream 구현** → 데이터 흐름 확보
2. **robotStore/settingsStore 범위 통일** → 일관성 확보
3. **AIStatusPanel/DetailModal 기준 수정** → 기본 표시 수정
4. **AIOverlay/AlertFeed 데이터 연결** → UI 동작화
5. **기타 기능 구현** (freeze-frame, spacebar, 등)
6. **추가 컴포넌트 검토** (History, MiniMap, DriveController, 등)

---

## 📌 주요 문서 참고

- `docs/specs/API_DETAILS.md` - API 계약
- `docs/specs/UI_DETAILS.md` - UI 스펙
- `docs/specs/IMPLEMENTATION_PHASES.md` - Phase 구분
- `docs/AGENTS.md` - 전체 규칙 및 상태 계약