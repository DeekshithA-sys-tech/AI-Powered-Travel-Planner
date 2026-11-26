import MarkdownView from "./MarkdownView";
import RawBlock from "./RawBlock";

const AGENT_META = {
  flight_agent: { icon: "✈️", label: "Flight Agent", field: "flight_results", empty: "No flight data returned.", raw: true },
  hotel_agent: { icon: "🏨", label: "Hotel Agent", field: "hotel_results", empty: "No hotel data returned.", raw: true },
  itinerary_agent: { icon: "🗓️", label: "Itinerary Agent", field: "itinerary", empty: "No itinerary generated.", raw: false },
  final_agent: { icon: "🧠", label: "Final Agent", field: "final_plan", empty: "No final response.", raw: false },
};

const DEFAULT_NODES = ["flight_agent", "hotel_agent", "itinerary_agent", "final_agent"];

function StatusBadge({ state }) {
  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
        ✓ Complete
      </span>
    );
  }
  if (state === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3a7bd5]/20 px-2.5 py-0.5 text-xs font-semibold text-[#7ab8f5]">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#7ab8f5]/30 border-t-[#7ab8f5]" />
        Running…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-[#1a2e44]/60 px-2.5 py-0.5 text-xs font-medium text-[#7aa8cc]">
      Waiting
    </span>
  );
}

export default function ProgressSteps({ steps, data, isDone }) {
  const items =
    steps.length > 0
      ? steps
      : DEFAULT_NODES.map((node) => ({
          node,
          state: isDone || data[AGENT_META[node].field] ? "done" : "pending",
        }));

  return (
    <section className="mt-6" aria-live="polite">
      <div className="mb-3 flex items-center gap-2 border-b border-line pb-2">
        <span className="text-lg font-semibold text-[#e0edf8]">🤖 Agent Pipeline — Live</span>
      </div>

      <div className="flex flex-col gap-3">
        {items.map(({ node, state }) => {
          const meta = AGENT_META[node] || { icon: "🔧", label: node, field: node, empty: "No output.", raw: false };
          const text = data[meta.field];
          const shouldExpand = state === "done" || state === "running";

          return (
            <details
              key={node}
              open={shouldExpand}
              className="overflow-hidden rounded-xl border border-[#1e3050] bg-[#0e1a2e]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[15px] font-semibold text-white select-none hover:bg-[#13223b]">
                <span className="flex items-center gap-2">
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </span>
                <StatusBadge state={state} />
              </summary>

              <div className="border-t border-[#1e3050] bg-[#0a1520] p-4 text-sm text-[#cce0f5]">
                {text ? (
                  meta.raw ? <RawBlock text={text} /> : <MarkdownView>{text}</MarkdownView>
                ) : (
                  <p className="italic text-[#7aa8cc]">
                    {state === "running" ? "Working on this step…" : meta.empty}
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
