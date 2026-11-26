export default function RawBlock({ text }) {
  if (!text) return <p className="text-muted">Nothing to show yet.</p>;
  return (
    <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-[#080f1a] p-4 text-sm leading-relaxed text-[#cce0f5]">
      {text}
    </pre>
  );
}
