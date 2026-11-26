const TECH_STACK = [
  "🔗 LangGraph",
  "🧠 Groq · LLaMA 3.3 70B",
  "🐘 PostgreSQL",
  "🔍 Tavily Search",
  "✈️ AviationStack",
];

const PIPELINE_STEPS = [
  "① Flight Agent",
  "② Hotel Agent",
  "③ Itinerary Agent",
  "④ Final Agent",
];

export default function Sidebar({
  userId,
  onUserIdChange,
  onRegenerateUserId,
  view,
  onNew,
  onHistory,
  mobileOpen,
  onCloseMobile,
}) {
  const navClass = (active) =>
    `w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
      active
        ? "border-[#3a7bd5] bg-[#14253d] text-white"
        : "border-[#1a2e44] bg-[#0e1a2b] text-[#a0c4e0] hover:border-[#3a7bd5] hover:text-white"
    }`;

  const content = (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-4 py-6">
      <div className="flex items-center justify-between border-b border-[#1a2e44] pb-4">
        <span className="text-base font-semibold text-[#e0edf8]">🌍 AI Travel Planner</span>
        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-md px-2 py-1 text-sm text-[#a0c4e0] hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            onNew();
            onCloseMobile?.();
          }}
          className={navClass(view === "plan")}
        >
          ✨ New Travel Plan
        </button>
        <button
          type="button"
          onClick={() => {
            onHistory();
            onCloseMobile?.();
          }}
          className={navClass(view === "history")}
        >
          🕘 Saved History
        </button>
      </nav>

      <div className="border-t border-[#1a2e44] pt-4">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="user-thread-id"
            className="block text-xs font-semibold tracking-wider text-[#7ab8f5] uppercase"
          >
            👤 Session UUID
          </label>
          {onRegenerateUserId && (
            <button
              type="button"
              onClick={onRegenerateUserId}
              className="text-xs font-medium text-[#7ab8f5] hover:text-white"
              title="Generate new UUID"
            >
              ↻ New
            </button>
          )}
        </div>
        <input
          id="user-thread-id"
          type="text"
          value={userId}
          onChange={(e) => onUserIdChange(e.target.value)}
          placeholder="Leave blank for auto UUID"
          className="mt-2 w-full rounded-lg border border-[#1a2e44] bg-[#0e1a2b] px-3 py-2 text-xs text-[#e0edf8] placeholder-[#3a5570] outline-none focus:border-[#3a7bd5] focus:ring-2 focus:ring-[#3a7bd5]/20"
        />
        <p className="mt-1.5 text-xs leading-relaxed text-[#7aa8cc]">
          Unique thread ID used to save and reload this plan.
        </p>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold text-[#e0edf8]">Powered by</div>
        <div className="flex flex-col gap-1.5">
          {TECH_STACK.map((tech) => (
            <div
              key={tech}
              className="rounded-lg border border-[#1a2e44] bg-[#0e1a2b] px-3 py-1.5 text-[13px] text-[#7aa8cc]"
            >
              {tech}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold text-[#e0edf8]">Agent Pipeline</div>
        <div className="flex flex-col gap-1.5">
          {PIPELINE_STEPS.map((step) => (
            <div
              key={step}
              className="rounded-lg border border-[#1a2e44] bg-[#0e1a2b] px-3 py-1.5 text-[13px] text-[#7aa8cc]"
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-[#141f30] bg-[#090e18] lg:block">
        <div className="sticky top-0 h-screen">{content}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-72 border-r border-[#141f30] bg-[#090e18]">{content}</div>
          <button
            type="button"
            aria-label="Close navigation"
            className="flex-1 bg-black/60"
            onClick={onCloseMobile}
          />
        </div>
      )}
    </>
  );
}
