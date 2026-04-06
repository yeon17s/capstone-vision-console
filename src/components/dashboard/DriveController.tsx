const ARROW_BTN =
  "flex items-center justify-center rounded-lg border border-mission-border bg-mission-bg text-base text-mission-text transition hover:border-mission-text hover:bg-mission-panel hover:text-mission-text active:scale-90";

export default function DriveController() {
  return (
    <div className="rounded-[18px] border border-mission-border bg-mission-panel shadow-mission-soft">
      <div className="px-5 py-4">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-mission-text">
          Robot Drive
        </p>

        {/* D-pad + joystick */}
        <div className="flex items-center justify-center">
          <div className="relative h-40 w-40">
            {/* Joystick zone */}
            <div
              id="joystick-zone"
              className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-mission-border bg-mission-bg shadow-mission-soft"
            >
              <div className="h-7 w-7 rounded-full border border-mission-text bg-mission-panel" />
            </div>

            {/* Up */}
            <button type="button" className={`absolute left-1/2 top-0 h-10 w-10 -translate-x-1/2 ${ARROW_BTN}`}>↑</button>
            {/* Down */}
            <button type="button" className={`absolute bottom-0 left-1/2 h-10 w-10 -translate-x-1/2 ${ARROW_BTN}`}>↓</button>
            {/* Left */}
            <button type="button" className={`absolute left-0 top-1/2 h-10 w-10 -translate-y-1/2 ${ARROW_BTN}`}>←</button>
            {/* Right */}
            <button type="button" className={`absolute right-0 top-1/2 h-10 w-10 -translate-y-1/2 ${ARROW_BTN}`}>→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
