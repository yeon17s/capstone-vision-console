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
  - class
  - confidence
  - keep canvas mounted when `class === "none"`
- `AIStatusPanel`:
  - last class
  - confidence
  - FPS
  - frame delay
  - drive mode
  - visual mode

### Controls
- `AIConfig`:
  - threshold slider or numeric input
  - update runtime state immediately
- `EStopButton`:
  - publish zero velocity to `/cmd_vel`
  - override normal drive commands
  - highest visual priority
- `DriveModeControl`:
  - `manual`
  - `auto patrol` state placeholder
- `DriveController`:
  - joystick UI
  - publish to `/cmd_vel`
  - forward / backward / left / right

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
  - short capture around detection event
  - include timestamp + pose context

### Additional Controls / Status
- `PanTiltController`:
  - D-pad UI
  - publish to `/pan_tilt_cmd`
- `TopBar` status:
  - battery percent from `/battery_state`
  - warning at `<= 20%`
  - latency in `ms`

### History / Patrol
- `FilterBar`:
  - date/time range filter
  - confidence range filter
  - class filter
- `DetectionTable`:
  - detection list view
  - timestamp
  - class
  - confidence
  - location
- `DetailModal`:
  - event detail view
  - image comparison
  - map/time context
- `Auto Patrol`:
  - waypoint-based patrol integration
  - aligned with drive mode state
  - manual override + E-stop must still win

### Phase 2 Deliverables
- Alarm feedback
- Inverted visual mode
- Minimap + waypoint interaction
- Alert feed
- Freeze-frame capture
- Pan/tilt control
- Battery + latency status
- History workflow
- Auto patrol integration

## Implementation Notes
- Use `src/lib/rosClient.ts` for ROS only
- Use `src/hooks/useAIStream.ts` for AI WebSocket only
- Keep threshold as immediate global runtime state
- When detection becomes `"none"`, clear bbox only
- E-stop must publish immediately and take priority
- Do not break Settings persistence / hydration
