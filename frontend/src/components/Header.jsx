export default function Header({ view, onNew, onHistory, onOpenSidebar }) {
  const link = (active) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${
      active ? "bg-[#14253d] text-[#7ab8f5]" : "text-[#a0c4e0] hover:text-white"
    }`;

  return (
    <header className="flex items-center justify-between border-b border-[#141f30] bg-[#090e18] px-4 py-3 lg:hidden">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-lg border border-[#1a2e44] bg-[#0e1a2b] px-2.5 py-1.5 text-sm text-[#e0edf8]"
          aria-label="Open menu"
        >
          ☰
        </button>
        <button type="button" onClick={onNew} className="text-base font-bold text-[#e0edf8]">
          🌍 AI Travel Planner
        </button>
      </div>
      <nav className="flex gap-2">
        <button type="button" onClick={onNew} className={link(view === "plan")}>New plan</button>
        <button type="button" onClick={onHistory} className={link(view === "history")}>History</button>
      </nav>
    </header>
  );
}
