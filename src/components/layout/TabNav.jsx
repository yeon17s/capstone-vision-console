const tabs = ["Dashboard", "History", "Settings"];

function TabNav({ activeTab, onChange }) {
  return (
    <nav className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
            activeTab === tab
              ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
              : "border-slate-700 text-slate-200 hover:border-cyan-400 hover:text-cyan-200"
          }`}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
}

export default TabNav;
