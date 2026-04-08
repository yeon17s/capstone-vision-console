# AGENTS.md

Rules for `capstone-vision-console`.

Detailed specs:
- `docs/specs/API_DETAILS.md`
- `docs/specs/UI_DETAILS.md`
- `docs/specs/WIREFRAME_NOTES.md`

## Goal
- TurtleBot3 monitoring UI for RCOD-based camouflaged-object detection
- Real-time visualization plus manual control
- Single RGB camera; support both auto patrol and operator-driven search

## Stack
- React, TypeScript, Tailwind
- Zustand
- roslibjs, ros2djs
- Axios
- MJPEG via `web_video_server`

## Hard Rules
- Keep the current file structure and component responsibilities
- Use Tailwind only
- Manage ROS only through `src/lib/rosClient.ts`
- Create/manage AI WebSocket only in `src/hooks/useAIStream.ts`
- Read/update endpoints and thresholds only via `src/store/settingsStore.ts`
- Do not break `localStorage` hydration or persistence
- Treat `settingsStore` threshold as global runtime state; changes must apply immediately

## Structure
- Pages: `Dashboard.tsx`, `History.tsx`, `Settings.tsx`
- Dashboard: `VideoStream`, `AIOverlay`, `AIStatusPanel`, `DriveController` (includes drive modes + E-stop), `MiniMap`, `AlertFeed`, `CriticalAlarmOverlay`
- History: `DetectionTable`, `FilterBar`, `DetailModal`
- Settings: `ConnectionForm`, `DiagnosticsMonitor`, `StorageSettings`, `AIConfig`
- Stores: `src/store/robotStore.ts`, `src/store/settingsStore.ts`

## State Contract
- `robotStore`: `rosConnected`, `aiConnected`, `cameraConnected`, `driveMode`, `batteryPercent`, `pose`, `detection`, `detectionLog`
- `detection`: `class`, `confidence`, `bbox`, `fps`, `frameDelayMs`
- Keep only the latest 50 `detectionLog` items
- `settingsStore` defaults:
  - `jetsonIp=192.168.0.45`
  - `rosbridgePort=9090`
  - `fastapiUrl=http://121.156.245.81:8000`
  - `confidenceThreshold=0.5`
  - `audioAlarmEnabled=true`

## Endpoints
- MJPEG: `http://<jetsonIp>:8080/stream?topic=/cv_camera/image_raw`
- ROS Bridge: `ws://<jetsonIp>:<rosbridgePort>`
- AI WS default: `ws://<jetsonIp>:8000/ws/ai_stream`
- FastAPI default: `http://121.156.245.81:8000`
- FastAPI docs: `http://121.156.245.81:8000/docs`

## Runtime Rules
- AI `confidence` is `0..100`
- If detection is missing or below threshold, use `class: "none"`
- If `class === "none"`, clear bbox only; keep the overlay canvas mounted
- Visual mode is frontend-only via CSS `filter: invert(1)`; no extra backend image source
- `/cmd_vel`: manual drive and E-stop
- `/battery_state`: battery
- `/amcl_pose`: pose
- `/map`: minimap
- Drive rule: `linear.x > 0` forward, `< 0` backward; `angular.z > 0` left, `< 0` right
- E-stop must publish zero velocity once immediately and override any other drive command
- AI stream target rate is roughly `10..20 fps` (`0.05s..0.1s` interval)
- Battery warning threshold from spec: `<= 20%`

## Implementation Bias
- Prefer simple state flow over extra abstraction
- Fit new work into the existing Dashboard/History/Settings flow and store shape
- Do not duplicate ROS/WS instances, hardcode runtime config, or create out-of-band connections
- Keep MVP-critical behavior in core docs; put infrequent or future-detail contracts in `docs/specs/*`
