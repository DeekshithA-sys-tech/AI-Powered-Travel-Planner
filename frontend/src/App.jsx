import { useState } from "react";
import { useStreamingPlan } from "./hooks/useStreamingPlan";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import HeroBanner from "./components/HeroBanner";
import SearchForm from "./components/SearchForm";
import ProgressSteps from "./components/ProgressSteps";
import PlanResult from "./components/PlanResult";
import HistoryList from "./components/HistoryList";
import ErrorBanner from "./components/ErrorBanner";

const createUuid = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });

export default function App() {
  const plan = useStreamingPlan();
  const [view, setView] = useState("plan"); // plan | history
  const [userId, setUserId] = useState(createUuid);
  const [queryInput, setQueryInput] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const goNew = () => {
    plan.reset();
    setQueryInput("");
    setUserId(createUuid());
    setView("plan");
  };

  const openFromHistory = async (id) => {
    setView("plan");
    setUserId(id);
    const loaded = await plan.load(id);
    if (loaded?.user_query) setQueryInput(loaded.user_query);
  };

  const showPipeline = plan.status === "running" || plan.status === "done";

  return (
    <div className="flex min-h-screen bg-[#080d14] text-[#e0edf8]">
      <Sidebar
        userId={userId}
        onUserIdChange={setUserId}
        onRegenerateUserId={() => setUserId(createUuid())}
        view={view}
        onNew={goNew}
        onHistory={() => setView("history")}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          view={view}
          onNew={goNew}
          onHistory={() => setView("history")}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {view === "history" ? (
            <HistoryList onOpen={openFromHistory} />
          ) : (
            <>
              <HeroBanner onSelectDestination={(prompt) => setQueryInput(prompt)} />
              <SearchForm
                value={queryInput}
                onChange={setQueryInput}
                onSubmit={(q) => plan.start(q, userId)}
                disabled={plan.status === "running"}
              />
              <ErrorBanner message={plan.error} onDismiss={plan.reset} />
              {showPipeline && (
                <ProgressSteps
                  steps={plan.steps}
                  data={plan.data}
                  isDone={plan.status === "done"}
                />
              )}
              {plan.status === "done" && (
                <PlanResult
                  query={plan.query}
                  threadId={plan.threadId}
                  data={plan.data}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
