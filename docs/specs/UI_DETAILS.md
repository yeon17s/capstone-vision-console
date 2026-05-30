# UI_DETAILS.md

Detailed UI/component contracts extracted from the capstone interface spec.

## Dashboard

### TopBar
- Tabs: `Dashboard`, `History`, `Settings`
- Status lights: ROS, FastAPI, camera
- Network ping in `ms`
- Battery percent display
- Battery warning when `<= 20%`
- Visual mode label, default `RGB`

### Main Video Area
- `VideoStream`: render MJPEG source
- `AIOverlay`: draw bbox and confidence badge
- `VideoStream` visual mode: `Spacebar` toggles CSS invert mode
- `CriticalAlarmOverlay`:
  - trigger when detection confidence meets or exceeds threshold
  - flashing red frame
  - warning text popup
  - audio alert if enabled
- Freeze-frame capture (MVP):
  - snapshot at detection moment
  - snapshot ~1–2s after detection
  - extract via `canvas.toDataURL()` from `<img>` tag
  - 2 total snapshots per detection
- `AIStatusPanel` shows:
  - last class
  - confidence
  - current mode
  - visual mode
  - frame delay (frame_delay_ms 3-tier color indicator):
    - 0–200ms → green (normal)
    - 200–500ms → yellow (warning)
    - 500ms+ → red (critical + warning text)
  - FPS

### Control Panel
- `DriveController`: unified control combining:
  - Joystick UI with directional buttons (up/down/left/right)
  - Drive mode toggle (`manual` / `auto patrol`)
  - E-stop button with highest visual priority
- `MiniMap`:
  - render `/map`
  - show robot pose and heading from `/amcl_pose`
  - show waypoint targets
  - spec also calls for detection markers on the map
- `AlertFeed` cards should include:
  - inverted thumbnail
  - class
  - confidence
  - map location
  - time
- Alert card interaction:
  - clicking a card should focus the minimap on that detection point
  - spec also mentions a blink/highlight effect
- **Phase 2**: False Positive reporting button on each card
  - user can mark detection as false positive
  - optional note submission

## History
- `FilterBar`:
  - date/time range
  - confidence range
  - class selector
- Optional heatmap toggle:
  - plot accumulated detection locations on the map
  - use confidence as density weight
- `DetectionTable` columns:
  - timestamp
  - class
  - confidence
  - location
- `DetailModal`:
  - time and map location
  - large confidence visualization
  - detection-moment snapshot 단일 이미지 표시
  - before/after comparison slider (Phase 2 with ring-buffer clips)

## Settings

### Connection / Diagnostics
- `ConnectionForm` editable values:
  - TurtleBot IP
  - rosbridge port
  - backend URL
- `DiagnosticsMonitor` should periodically test:
  - ROS bridge
  - WebSocket / AI connection
  - FastAPI health

### AIConfig
- Global threshold slider
- Audio alarm toggle
- Spec also mentions volume control

### StorageSettings
- Storage Path: 젯슨 스냅샷 저장 경로 표시 (`snapshots/`)
- Clear Local Cache: 브라우저 localStorage의 설정값·FP overrides 초기화
- Delete All Data (Jetson): `DELETE /api/history` 호출 — DB 전체 행 삭제 + snapshots/ 파일 삭제. 성공 시 frontend historyLog·recentLog·pending queue 초기화. 2단계 확인(Confirm/Cancel) UI

## Shared Data Mapping
- `/cv_camera/image_raw`: video, freeze-frame source
- `/amcl_pose`: minimap, alert feed location, freeze-frame location context
- `/map`: minimap, history heatmap
- `/battery_state`: battery monitor
- `/cmd_vel`: E-stop and drive control

## Notes
- Inverted image is a frontend presentation mode, not a separate server image asset
- Threshold is global runtime state; overlay and alarm behavior should update immediately when Settings changes it
- Some items above are forward-looking spec targets and may be staged after MVP