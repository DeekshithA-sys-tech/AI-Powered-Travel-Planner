import { useCallback, useRef, useState } from "react";
import { streamPlan } from "../api/streamPlan";
import { getPlan, errorMessage } from "../api/planApi";
import { addHistory } from "../lib/history";

// status: idle | running | done | error
export function useStreamingPlan() {
  const [status, setStatus] = useState("idle");
  const [query, setQuery] = useState("");
  const [threadId, setThreadId] = useState(null);
  const [steps, setSteps] = useState([]); // [{ node, state: pending|running|done }]
  const [data, setData] = useState({});
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const setStepState = (node, state) =>
    setSteps((prev) => prev.map((s) => (s.node === node ? { ...s, state } : s)));

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
    setQuery("");
    setThreadId(null);
    setSteps([]);
    setData({});
    setError(null);
  }, []);

  const start = useCallback(async (q, requestedThreadId) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("running");
    setQuery(q);
    setSteps([]);
    setData({});
    setError(null);

    let completed = false;
    let failed = false;

    const onEvent = ({ event, data: payload }) => {
      switch (event) {
        case "start":
          setThreadId(payload.thread_id);
          setSteps(payload.steps.map((node) => ({ node, state: "pending" })));
          break;
        case "step_start":
          setStepState(payload.node, "running");
          break;
        case "step_done": {
          const { node, ...fields } = payload;
          setStepState(node, "done");
          setData((prev) => ({ ...prev, ...fields }));
          break;
        }
        case "complete":
          completed = true;
          setData((prev) => ({ ...prev, ...payload }));
          setThreadId(payload.thread_id);
          setStatus("done");
          addHistory({ thread_id: payload.thread_id, query: q, at: new Date().toISOString() });
          break;
        case "error":
          failed = true;
          setError(payload.message || "The planner failed.");
          setStatus("error");
          break;
        default:
          break;
      }
    };

    try {
      await streamPlan({
        query: q,
        threadId: requestedThreadId?.trim() || undefined,
        signal: controller.signal,
        onEvent,
      });
      if (!completed && !failed) {
        setError("The connection closed before the plan was finished.");
        setStatus("error");
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Cannot reach the server. Is the backend running?");
      setStatus("error");
    }
  }, []);

  const load = useCallback(async (id) => {
    abortRef.current?.abort();
    setStatus("running");
    setError(null);
    setSteps([]);
    try {
      const plan = await getPlan(id);
      setQuery(plan.user_query || "");
      setThreadId(plan.thread_id);
      setData(plan);
      setStatus("done");
      return plan;
    } catch (err) {
      setError(errorMessage(err));
      setStatus("error");
      return null;
    }
  }, []);

  return { status, query, threadId, steps, data, error, start, load, reset };
}
