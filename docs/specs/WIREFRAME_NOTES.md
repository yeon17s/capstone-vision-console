# WIREFRAME_NOTES.md

Text summary of `docs/wireframe/*.png` for low-token prompt reuse.

## Global Style
- Dark control-room UI with muted charcoal background
- Large rounded panels with thin bright outlines
- Slight glow on active elements; soft green/blue/red accents
- Dense dashboard layout with clear panel borders, not airy card spacing
- Typography is condensed, uppercase-heavy, industrial/monitor-like
- Keep the base UI mostly neutral; accents should be sparse and intentional

## System Color Palette
- CSS tokens are defined in `src/index.css`
- Tailwind tokens are exposed in `tailwind.config.js` as:
  - `mission.bg`
  - `mission.panel`
  - `mission.border`
  - `mission.text`
  - `mission.primary`
  - `mission.secondary`
  - `mission.active`
  - `mission.info`
  - `mission.critical`
  - `mission.suspicious`
- Semantic color rules:
  - selected / current focus / current mode -> blue
  - active / connected / confirmed -> green
  - critical / emergency -> red
  - suspicious / low-confidence candidate -> yellow
  - placeholder / inactive -> gray

## Reduced Palette Rule
- Default screen composition should be mostly:
  - neutral panels
  - neutral borders
  - white/light text
- Use blue as the primary accent for selected, current, or focused UI state
- Use green for healthy, connected, active, or confirmed system state
- Use red only for danger, emergency, critical detection, or destructive actions
- Use yellow only for suspicious or pending states
- Avoid showing green, blue, yellow, and red with equal visual weight in the same region
- In one local UI region, prefer at most:
  - one primary accent
  - one exception accent for warning or danger
- If a label does not express state or action priority, keep it neutral

## Palette Usage
- Use semantic names in code, not raw color names only
- Common UI mapping:
  - app background -> `mission.bg`
  - panel surface -> `mission.panel`
  - panel outline / grid line -> `mission.border`
  - primary text / telemetry -> `mission.text`
  - selected tab / current mode / selected control -> `mission.primary` or `mission.info`
  - healthy status dot / confirmed state -> `mission.secondary` or `mission.active`
  - E-stop / critical overlay / danger badge -> `mission.critical`
  - suspicious detection / pending state -> `mission.suspicious`
- Strong recommendation:
  - use `mission.info` for selection, not for every decorative highlight
  - prefer neutral text for static labels
  - reserve accent fills for selected, dangerous, or actionable elements

## Opacity Guide
- Mission-control UI often uses low-alpha accents for glow and overlays
- Alpha tokens are defined in `src/index.css`:
  - `--alpha-soft-fill`
  - `--alpha-hover-fill`
  - `--alpha-alert-glow`

## Global Layout
- Top horizontal navigation bar on every page
- Three primary tabs centered-left: `Dashboard`, `History`, `Settings`
- Right side of top bar contains compact status widgets: clock/status, connection indicators, battery, ping summary
- Main content uses framed zones instead of free-floating cards

## Dashboard Wireframe

### Layout
- Two-column composition
- Left: dominant video area taking most width
- Right: narrow control column stacked vertically
- Bottom of video area includes a full-width AI status strip

### Main Video Area
- Large camera frame with subtle gray placeholder image
- AI bbox overlay in red with confidence label attached near top
- Critical detection state adds a flashing red frame and large center warning banner
- Small visual-mode button sits inside top-right area of video
- Visual mode can extend from invert to a cycle: invert, high contrast, edge-emphasis
- Bbox rendering should support smoothing with about `0.5s` fade-out to reduce flicker

### AI Status Strip
- Horizontal metrics row under the video
- Shows last class, confidence, current mode, frame delay / FPS, freeze-frame state
- Optional enhancement: small confidence sparkline for recent trend
- Presentation is compact, inline, and telemetry-like

### Right Control Column
- `Control Panel` block title
- `DriveController` unified panel includes:
  - Circular joystick area for robot drive (up/down/left/right buttons)
  - Drive mode toggle (auto patrol / manual mode)
  - E-stop button with highest visual priority
- Alert feed sits near the bottom as stacked mini cards

### Alert Cards
- Small thumbnail on left
- Text metadata on right
- Class, confidence, location, and time are visible
- Designed as quick-scanning incident tiles, not rich cards
- Optional operator action: `False Positive`

## History Wireframe

### Layout
- Left sidebar for filtering
- Large central/right log table
- Detail panel overlays or docks on top of the table area
- Lower-left secondary panel for trend visualization

### Filter Sidebar
- Search field at top
- Date range inputs
- Confidence slider
- Class selector dropdown
- Optional extra text/operator filter slot
- Trend chart below filters inside a dashed secondary frame

### Detection Table
- Dense multi-row table with dark background
- Selected row gets a strong red outline
- Columns include:
  - timestamp
  - confidence
  - class
  - mode
  - status
- Status text uses semantic colors for quick reading

### Detail View
- Large donut chart for confidence
- Metadata block for location/time/FPS/frame delay
- Two-image comparison: original and inverted
- Center handle suggests before/after comparison slider
- Optional feedback section for label correction / false-positive review

## Settings Wireframe

### Layout
- Two-column grid with four main framed sections
- Top-left: network config form
- Top-right: diagnostics monitor
- Bottom-left: AI/sensor config
- Bottom-right: data/storage handling

### Network Config
- Simple stacked form rows
- Emphasis on editable IP, port, backend URL
- Wide `Save & Apply` button at the bottom

### Diagnostics Monitor
- Vertical list of status rows
- Each row uses a green dot + short status text
- Designed like a health checklist, not a chart

### AI / Sensor Config
- Large threshold slider as main control
- Current threshold text shown explicitly
- Audio alarm uses on/off toggle
- Volume uses secondary slider

### Data / Storage
- Storage policy shown as radio options
- Local path displayed in a subdued input-like row
- Cleanup actions are red full-width buttons

## Design Guidance For Implementation
- Prefer framed control panels over modern floating cards
- Favor clear borders and structured zones over soft shadows
- Keep the dashboard visually dense and operational, like mission-control software
- Make emergency actions visibly louder than routine controls
- Place telemetry in strips, rows, and compact boxes rather than verbose panels
- Use thumbnails and mini-panels for logs/alerts instead of large media cards
- Support COD-specific ambiguity states instead of binary detected/not-detected only
- Favor operator feedback hooks that can later support dataset correction or retraining workflows
- Reduce accent competition before adding new styling detail
- Neutral layout first, accent second

## Prompt Shortcut
- If only one line is needed in a prompt:
  - "Use the wireframe style: dark mission-control UI, outlined panels, dense dashboard, blue for selected UI, green for healthy status, red for critical alerts, large left video area, narrow right control column."
