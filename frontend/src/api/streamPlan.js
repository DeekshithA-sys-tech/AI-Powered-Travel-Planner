import { API_URL } from "./client";

// axios cannot stream in the browser, so the SSE POST uses fetch + ReadableStream.
function parseEvent(raw) {
  let event = "message";
  const dataLines = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (!dataLines.length) return null;
  try {
    return { event, data: JSON.parse(dataLines.join("\n")) };
  } catch {
    return null;
  }
}

export async function streamPlan({ query, threadId, signal, onEvent }) {
  const payload = { query };
  if (threadId) payload.thread_id = threadId;

  const res = await fetch(`${API_URL}/api/plan/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.detail) {
        msg = typeof body.detail === "string" ? body.detail : "Please check your request (5-1000 characters).";
      }
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const evt = parseEvent(raw);
      if (evt) onEvent(evt);
    }
  }
}
