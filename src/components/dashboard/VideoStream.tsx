import Typography from "../ui/Typography";

export default function VideoStream() {
  const streamUrl =
    "http://192.168.0.45:8080/stream?topic=/cv_camera/image_raw";

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-10 rounded-[20px] border border-[var(--color-accent-yellow)]" />

      <img
        src={streamUrl}
        alt="Camera feed"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-x-4 top-4 z-10 flex items-start justify-between">
        <div className="rounded-md bg-mission-panel px-3 py-1.5 shadow-mission-soft">
          <Typography as="span" variant="panelTitle" className="tracking-[0.18em]">
            Camera Stream &amp; AI Output
          </Typography>
        </div>

        <div className="rounded-lg border border-[var(--color-accent-yellow)] bg-mission-panel px-3 py-1.5">
          <Typography variant="overline" className="tracking-[0.14em]">Toggle Visual View (Spacebar)</Typography>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/45 to-transparent" />
    </>
  );
}
