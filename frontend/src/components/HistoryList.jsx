import { useState } from "react";
import { getHistory, clearHistory } from "../lib/history";

export default function HistoryList({ onOpen }) {
  const [items, setItems] = useState(getHistory);

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4 py-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <h2 className="text-2xl font-bold tracking-tight text-[#e8f4ff]">Past Travel Plans</h2>
        {items.length > 0 && (
          <button
            onClick={() => { clearHistory(); setItems([]); }}
            className="min-h-10 px-2 text-sm font-semibold text-muted underline hover:text-white"
          >
            Clear list
          </button>
        )}
      </div>

      {items.length === 0 && (
        <p className="rounded-xl border border-line bg-panel p-5 text-muted">
          No saved plans yet. Plan a trip and it will show up here.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {items.map((h) => (
          <li key={h.thread_id}>
            <button
              onClick={() => onOpen(h.thread_id)}
              className="w-full rounded-xl border border-line bg-panel p-4 text-left transition hover:border-brand hover:bg-[#111c2d]"
            >
              <div className="font-semibold text-[#e8f4ff]">{h.query}</div>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span>{new Date(h.at).toLocaleString()}</span>
                <code className="rounded bg-[#0a1520] px-2 py-0.5 text-[#7ab8f5]">{h.thread_id}</code>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
