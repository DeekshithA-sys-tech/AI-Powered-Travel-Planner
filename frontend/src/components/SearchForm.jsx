const QUICK = [
  "7-day Japan under ₹2L",
  "Paris trip for 5 days",
  "Dubai weekend trip",
  "Bali backpacking 10 days",
];
const MAX = 1000;

export default function SearchForm({ value, onChange, onSubmit, disabled }) {
  const trimmed = value.trim();
  const valid = trimmed.length >= 5 && trimmed.length <= MAX;

  const submit = (e) => {
    e.preventDefault();
    if (valid && !disabled) onSubmit(trimmed);
  };

  return (
    <section className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
      <div className="mb-3 text-xs font-semibold tracking-[0.1em] text-[#7ab8f5] uppercase">
        🗺️ Describe your trip
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange(label)}
            className="rounded-xl border border-[#1e3050] bg-[#111b2b] px-3 py-2.5 text-center text-xs font-medium text-[#e0edf8] transition hover:border-[#3a7bd5] hover:bg-[#1a2e47] hover:text-white"
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <textarea
          id="q"
          rows={4}
          maxLength={MAX}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Plan a complete 7-day Japan trip including flights, hotels and sightseeing under ₹2 lakhs"
          className="w-full resize-none rounded-[10px] border border-[#1e2e44] bg-[#0a1520] p-3.5 text-[15px] text-[#e8f4ff] placeholder-[#4a6a85] outline-none focus:border-[#3a7bd5] focus:ring-2 focus:ring-[#3a7bd5]/20"
        />

        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {trimmed.length > 0 && trimmed.length < 5
              ? "Please enter at least 5 characters."
              : "Tip: Mention destination, duration, and budget."}
          </span>
          <span>{value.length} / {MAX}</span>
        </div>

        <button
          type="submit"
          disabled={!valid || disabled}
          className="generate-btn w-full rounded-xl px-6 py-3.5 text-base font-bold tracking-[0.03em] text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled ? "⏳  Planning Your Trip..." : "🚀  Generate My Travel Plan"}
        </button>
      </form>
    </section>
  );
}
