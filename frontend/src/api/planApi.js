import { api } from "./client";

// Load a saved plan from the checkpoint (non-streaming, so axios is fine here).
export async function getPlan(threadId) {
  const { data } = await api.get(`/api/plan/${threadId}`);
  return data;
}

export async function checkHealth() {
  const { data } = await api.get("/api/health");
  return data;
}

export function errorMessage(err) {
  if (err?.response?.status === 404) return "Plan not found.";
  if (err?.response?.data?.detail) return String(err.response.data.detail);
  if (err?.code === "ERR_NETWORK") return "Cannot reach the server. Is the backend running?";
  return err?.message || "Something went wrong.";
}
