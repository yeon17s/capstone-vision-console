export default function VideoStream() {
  const streamUrl =
    "http://192.168.0.45:8080/stream?topic=/cv_camera/image_raw";

  return (
    <>
      <img
        src={streamUrl}
        alt="Camera feed"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-x-4 top-4 z-10 flex items-start justify-between">
        <div className="rounded-md bg-mission-panel px-3 py-1.5 shadow-mission-soft">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-mission-text">
            Camera Stream &amp; AI Output
          </span>
        </div>

        <div className="rounded-lg border border-mission-border bg-mission-panel px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-mission-text">
          Toggle Visual View (Spacebar)
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/45 to-transparent" />
    </>
  );
}
