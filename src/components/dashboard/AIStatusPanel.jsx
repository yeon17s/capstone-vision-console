function AIStatusPanel() {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-100 shadow-sm">
      <h2 className="text-lg font-semibold">AI Status</h2>
      <p className="mt-2 text-sm text-slate-400">FPS, frame delay, and last detected class.</p>
    </section>
  );
}

export default AIStatusPanel;
