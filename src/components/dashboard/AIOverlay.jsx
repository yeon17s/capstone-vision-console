function AIOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-xl border border-dashed border-cyan-500/40">
      <span className="absolute left-3 top-3 rounded bg-cyan-500/15 px-2 py-1 text-xs font-medium text-cyan-200">
        AI Overlay
      </span>
    </div>
  );
}

export default AIOverlay;
