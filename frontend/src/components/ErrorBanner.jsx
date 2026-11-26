export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div role="alert" className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-red-500/40 bg-[#1a1018] px-5 py-4 text-red-200">
      <p className="text-[15px]">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 px-2 text-sm font-semibold text-red-300 underline hover:text-white">
          Dismiss
        </button>
      )}
    </div>
  );
}
