# UI_DETAILS.md

Detailed UI/component contracts extracted from the capstone interface spec.

## Dashboard

### Top Bar
- Tabs: `Dashboard`, `History`, `Settings`
- Status lights: ROS, FastAPI, camera
- Network ping in `ms`
- Battery percent display
- Battery warning when `<= 20%`
- Visual mode label, default `RGB`

### Main Video Area
- `VideoStream`: render MJPEG source
- `AIOverlay`: draw bbox and confidence badge
- `Visual Mode Toggle`: `Spacebar` toggles CSS invert mode
- `CriticalAlarmOverlay`:
  - trigger when detection confidence meets or exceeds threshold
  - flashing red frame
  - warning text popup
  - audio alert if enabled
- `FreezeFrameCatcher`:
  - capture about `0.5s` of frames when a detection event happens
  - spec ties capture to image stream plus pose/timestamp context
- `AIStatusPanel` shows:
  - last class
  - confidence
  - current mode
  - visual mode
  - frame delay
  - FPS

### Control Panel
- `EStopButton`: highest visual priority
- `DriveModeToggle`: `auto patrol` / `manual`
- `DriveController`: joystick drives `/cmd_vel`
- `PanTiltController`: D-pad sends `/pan_tilt_cmd`
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

## History
- Left filters:
  - date/time range
  - confidence range
  - class selector
- Optional `Heatmap` toggle:
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
  - original image + inverted image side-by-side
  - before/after comparison slider

## Settings

### Connection / Diagnostics
- Editable values:
  - TurtleBot IP
  - rosbridge port
  - backend URL
- Diagnostics should periodically test:
  - ROS bridge
  - WebSocket / AI connection
  - FastAPI health

### AI Config
- Global threshold slider
- Audio alarm toggle
- Spec also mentions volume control

### Storage / Cleanup
- Storage policy option:
  - save original only
  - save original + inverted
- Local cleanup action for cached data and old logs

## Shared Data Mapping
- `/cv_camera/image_raw`: video, freeze-frame source
- `/amcl_pose`: minimap, alert feed location, freeze-frame location context
- `/map`: minimap, history heatmap
- `/battery_state`: battery monitor
- `/cmd_vel`: E-stop and drive control
- `/pan_tilt_cmd`: pan/tilt control

## Notes
- Inverted image is a frontend presentation mode, not a separate server image asset
- Threshold is global runtime state; overlay and alarm behavior should update immediately when Settings changes it
- Some items above are forward-looking spec targets and may be staged after MVP
