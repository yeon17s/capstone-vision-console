export default function MiniMap() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        Mini Map
      </p>
      <div className="flex h-40 items-center justify-center rounded border border-slate-800 bg-slate-950">
        <p className="text-xs text-slate-600">ros2djs map viewport</p>
      </div>
    </div>
  );
}
