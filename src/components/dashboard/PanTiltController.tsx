type Direction = "up" | "left" | "center" | "right" | "down";

interface DPadButton {
  label: string;
  pos: string;
  dir: Direction;
  isCenter?: boolean;
}

const DPAD_BUTTONS: DPadButton[] = [
  { label: "↑", pos: "col-start-2 row-start-1", dir: "up" },
  { label: "←", pos: "col-start-1 row-start-2", dir: "left" },
  { label: "●", pos: "col-start-2 row-start-2", dir: "center", isCenter: true },
  { label: "→", pos: "col-start-3 row-start-2", dir: "right" },
  { label: "↓", pos: "col-start-2 row-start-3", dir: "down" },
];

export default function PanTiltController() {
  return (
    <div className="rounded-[18px] border border-mission-border bg-mission-panel px-5 py-4 shadow-mission-soft">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-mission-text">
        Camera Pan / Tilt
      </p>
      <div className="flex items-center justify-center">
        <div className="grid grid-cols-3 grid-rows-3 gap-1.5">
          {DPAD_BUTTONS.map(({ label, pos, dir, isCenter }) => (
            <button
              key={dir}
              type="button"
              className={`${pos} flex h-11 w-11 items-center justify-center rounded-lg text-base font-bold transition active:scale-90 ${
                isCenter
                  ? "cursor-default border border-mission-border bg-mission-panel text-mission-text"
                  : "border border-mission-border bg-mission-bg text-mission-text hover:border-mission-text hover:bg-mission-panel hover:text-mission-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
