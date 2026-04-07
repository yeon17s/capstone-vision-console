import Typography from "../ui/Typography";

export default function AIOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-[20px]">
      <div className="absolute left-[22%] top-[16%] bottom-[18%] w-[110px] rounded-sm border-2 border-mission-critical shadow-mission-glow-red">
        <Typography as="span" variant="panelTitle" className="absolute -top-8 left-0 rounded-md bg-mission-critical px-2 py-1 tracking-[0.08em] text-white">
          Person | 98.5%
        </Typography>
      </div>
    </div>
  );
}
