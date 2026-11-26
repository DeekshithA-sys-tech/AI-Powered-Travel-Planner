const KEY = "travel-planner-history";

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function addHistory(item) {
  try {
    const list = getHistory().filter((h) => h.thread_id !== item.thread_id);
    localStorage.setItem(KEY, JSON.stringify([item, ...list].slice(0, 20)));
  } catch {
    /* storage unavailable */
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
