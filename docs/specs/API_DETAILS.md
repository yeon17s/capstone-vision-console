# API_DETAILS.md

Detailed runtime/API contracts extracted from the capstone specs.

## Network Defaults
- Jetson IP default: `192.168.0.45`
- MJPEG: `http://<jetsonIp>:8080/stream?topic=/cv_camera/image_raw`
- ROS Bridge: `ws://<jetsonIp>:9090`
- AI WS: `ws://<jetsonIp>:8000/ws/ai_stream`
- FastAPI: `http://121.156.245.81:8000`
- Swagger: `http://121.156.245.81:8000/docs`

## Frontend/Backend Split
- `VideoStream` invert mode is frontend-only: apply CSS `filter: invert(1)`
- ROS control should go browser -> `roslibjs` -> Jetson directly; do not proxy through FastAPI

## ROS Topics
- `/cmd_vel` `geometry_msgs/Twist`: drive + E-stop
- `/battery_state` `sensor_msgs/BatteryState`: use `percentage` (`0.0..1.0`) and multiply by `100`
- `/amcl_pose` `geometry_msgs/PoseWithCovarianceStamped`: robot/map pose
- `/map` `nav_msgs/OccupancyGrid`: minimap / heatmap background
- `/pan_tilt_cmd` `geometry_msgs/Vector3`: camera `pan`, `tilt`
- Camera stream source in spec: `/cv_camera/image_raw` via `web_video_server`

## Drive Rules
- `DriveController` uses `/cmd_vel` for manual movement
- `DriveModeControl` switches between `manual` and `auto patrol` state
- `linear.x > 0`: forward
- `linear.x < 0`: backward
- `angular.z > 0`: left
- `angular.z < 0`: right
- Suggested drive speed from spec: `linear.x` around `0.1..0.2`
- `EStopButton` publishes a single zero-velocity message immediately
- E-stop has priority over any in-flight drive command

## FastAPI Endpoints
- `GET /ping`: `DiagnosticsMonitor` health check
- `GET /api/settings/threshold`: `AIConfig` threshold read
- `POST /api/settings/threshold`: `AIConfig` threshold update with `{ "threshold": number }`
- `GET /api/history`: detection history; spec currently says dummy data is acceptable for MVP

## AI WebSocket Contract
- Endpoint: `/ws/ai_stream`
- Expected push interval: about `0.05s..0.1s`
- Practical target: about `10..20 fps`
- `class` field: `"person"` or `"none"` only (single-class detection; multiclass deferred to June Phase 2)

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

## AI Runtime Rules
- `confidence` uses percent scale `0..100`, not `0..1`
- If no object is detected or confidence is below threshold:
  - set `class` to `"none"`
  - set `confidence` to `0`
  - set `bbox` to zeros
- When `"none"` arrives, `AIOverlay` should clear bbox but keep the overlay canvas mounted
- Threshold filtering is global and must reflect `AIConfig` changes immediately
- **frame_delay_ms thresholds** (frontend uses these to color-code status):
  - `<= 200ms`: normal (green)
  - `200ms ~ 500ms`: warning (yellow)
  - `> 500ms`: critical (red)

## Diagnostics Signals
- `DiagnosticsMonitor` should cover ROS bridge, FastAPI, and camera connectivity
- `TopBar` should show network ping / round-trip latency in `ms`
- `TopBar` battery warning threshold: `<= 20%`