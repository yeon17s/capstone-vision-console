function TopBar() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Sentinel UI</p>
          <h1 className="text-xl font-semibold text-slate-50">RCOD Mission Console</h1>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
