# IMPLEMENTATION_PHASES.md

Staged implementation scope for the capstone vision console.

## Phase 1: MVP

### Goal
- Complete the minimum operator loop:
  - connect
  - monitor
  - control
  - stop safely

### Settings / Diagnostics
- `ConnectionForm`:
  - TurtleBot IP
  - rosbridge port
  - backend URL
- Persist through Zustand + `localStorage`
- Hydrate saved values on startup
- `DiagnosticsMonitor`:
  - ROS bridge health
  - FastAPI health
  - camera stream health

### Dashboard Core
- `VideoStream`: MJPEG from `/cv_camera/image_raw`
- `AIOverlay`:
  - bbox
  - class: `"person"` or `"none"` only (single-class detection)
  - confidence
  - keep canvas mounted when `class === "none"`
- `AIStatusPanel`:
  - last class
  - confidence
  - FPS
  - frame delay (frame_delay_ms visualized by 3-tier color):
    - 0 ~ 200ms → green (normal)
    - 200 ~ 500ms → yellow (warning)
    - 500ms+ → red (critical)
  - drive mode
  - visual mode

### Controls
- `AIConfig`:
  - threshold slider or numeric input
  - update runtime state immediately
- `DriveController` (unified control panel):
  - Joystick UI with directional buttons (forward / backward / left / right)
  - Drive mode toggle (manual / auto patrol)
  - E-stop button (publish zero velocity, override all commands, highest priority)

### Phase 1 Deliverables
- Connection workflow
- Diagnostics status lights
- Live video + AI overlay
- AI status summary
- Threshold control
- E-stop + manual drive
- Global drive mode state

## Phase 2: Extended Features

### Goal
- Expand the MVP into a richer monitoring and response console.

### Dashboard Extensions
- `CriticalAlarmOverlay`:
  - trigger when confidence `>= threshold`
  - flashing red frame
  - warning text / popup
  - optional audio alarm
- `VideoStream` visual mode:
  - spacebar toggle
  - frontend-only `filter: invert(1)`
- `MiniMap`:
  - `/map`
  - robot pose / heading from `/amcl_pose`
  - waypoint targets
  - detection markers
- `AlertFeed`:
  - thumbnail
  - class
  - confidence
  - map location
  - timestamp
  - card click focuses related map point
- Freeze-frame capture:
  - snapshot at detection moment
  - additional snapshot ~1–2s after detection
  - extract via `canvas.toDataURL()` from `<img>` tag
  - total 2 captures per detection event

### Additional Controls / Status
- `TopBar` status:
  - battery percent from `/battery_state`
  - warning at `<= 20%`
  - latency in `ms`
- **Phase 2**: False Positive reporting on Alert Cards
  - user can report detections as false positives