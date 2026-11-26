import { useState } from "react";
import MarkdownView from "./MarkdownView";

function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

function buildExportMarkdown({ query, threadId, data, now }) {
  return `# Travel Plan
**Query:** ${query}
**Generated:** ${now.toLocaleString()}
**User / Thread ID:** ${threadId || "N/A"}

---

## ✈️ Flight Information
${data.flight_results || "N/A"}

---

## 🏨 Hotel Information
${data.hotel_results || "N/A"}

---

## 🗓️ Itinerary
${data.itinerary || "N/A"}

---

## 🧠 Final Travel Plan
${data.final_plan || "N/A"}

---
*LLM Calls: ${data.llm_calls ?? 0}*
`;
}

export default function PlanResult({ query, threadId, data }) {
  const [copied, setCopied] = useState(false);

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(data.final_plan || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const downloadPlan = () => {
    const now = new Date();
    const filename = `travel_plan_${formatTimestamp(now)}.md`;
    const content = buildExportMarkdown({ query, threadId, data, now });
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mt-6 flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-panel px-5 py-4 text-center">
          <div className="text-3xl font-bold text-[#4ea8f0]">4</div>
          <div className="mt-1 text-xs font-medium tracking-wider text-muted uppercase">Agents Run</div>
        </div>
        <div className="rounded-xl border border-line bg-panel px-5 py-4 text-center">
          <div className="text-3xl font-bold text-[#4ea8f0]">{data.llm_calls ?? 0}</div>
          <div className="mt-1 text-xs font-medium tracking-wider text-muted uppercase">LLM Calls</div>
        </div>
        <div className="rounded-xl border border-line bg-panel px-5 py-4 text-center">
          <div className="text-3xl font-bold text-[#4ea8f0]">✅</div>
          <div className="mt-1 text-xs font-medium tracking-wider text-muted uppercase">Status</div>
        </div>
      </div>

      {data.final_plan && (
        <div>
          <div className="mb-3 flex items-center gap-2 border-b border-line pb-2">
            <span className="text-lg font-semibold text-[#e0edf8]">🧠 Final Travel Plan</span>
          </div>
          <div className="final-card p-6 sm:p-7">
            <MarkdownView>{data.final_plan}</MarkdownView>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={downloadPlan}
          className="rounded-[10px] border border-[#2a5080] bg-[#1a3a5c] px-4 py-2.5 text-sm font-semibold text-[#e8f4ff] transition hover:bg-[#234b76]"
        >
          ⬇️ Download Plan
        </button>

        <button
          type="button"
          onClick={copyPlan}
          className="rounded-[10px] border border-[#1e2e44] bg-panel px-4 py-2.5 text-sm font-semibold text-[#e0edf8] transition hover:border-[#3a7bd5]"
        >
          {copied ? "✅ Copied!" : "📋 Copy Plan"}
        </button>
      </div>
    </section>
  );
}
