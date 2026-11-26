"""FastAPI backend for the AI Travel Planner.

Run:  uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""

import os
import json
import uuid
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from pydantic import BaseModel, Field
from langgraph.checkpoint.postgres import PostgresSaver

from travel_graph import build_graph, initial_state, PIPELINE, PUBLIC_KEYS
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is missing in .env file")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")


# ------------------------------------------------------------------
# Startup / shutdown: one pool, one checkpointer, one compiled graph
# ------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    pool = ConnectionPool(
        conninfo=DATABASE_URL,
        max_size=10,
        kwargs={
            "autocommit": True,          # needed for CREATE INDEX CONCURRENTLY
            "prepare_threshold": 0,
            "row_factory": dict_row,     # required by PostgresSaver
        },
        open=True,
    )
    checkpointer = PostgresSaver(pool)
    checkpointer.setup()                 # creates checkpoint tables once
    app.state.graph = build_graph(checkpointer)
    app.state.pool = pool
    yield
    pool.close()


app = FastAPI(title="AI Travel Planner API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------
# Schemas
# ------------------------------------------------------------------
class PlanRequest(BaseModel):
    query: str = Field(..., min_length=5, max_length=1000)
    thread_id: Optional[str] = None      # omit to start a new plan


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def sse(event: str, data: dict) -> str:
    """Format one Server-Sent Event."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def public_fields(update: dict) -> dict:
    """Keep only JSON-safe state keys (messages are LangChain objects)."""
    return {k: update[k] for k in PUBLIC_KEYS if k in update}


# ------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/plan/stream")
def stream_plan(body: PlanRequest, request: Request):
    """Run the graph and stream progress as SSE.

    Events:
      start         {thread_id, steps}
      step_start    {node}
      step_done     {node, ...partial results}
      complete      {thread_id, final_plan, flight_results, hotel_results, itinerary, llm_calls}
      error         {message}
    """
    graph = request.app.state.graph
    thread_id = body.thread_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    def event_stream():
        collected: dict = {}
        try:
            yield sse("start", {"thread_id": thread_id, "steps": PIPELINE})
            yield sse("step_start", {"node": PIPELINE[0]})

            for chunk in graph.stream(
                initial_state(body.query),
                config=config,
                stream_mode="updates",
            ):
                for node, update in chunk.items():
                    fields = public_fields(update or {})
                    collected.update(fields)
                    yield sse("step_done", {"node": node, **fields})

                    idx = PIPELINE.index(node) if node in PIPELINE else -1
                    if 0 <= idx < len(PIPELINE) - 1:
                        yield sse("step_start", {"node": PIPELINE[idx + 1]})

            yield sse("complete", {"thread_id": thread_id, **collected})
        except Exception as exc:  # surface failures to the UI instead of a dropped stream
            yield sse("error", {"message": str(exc)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disable proxy buffering (nginx)
        },
    )


@app.get("/api/plan/{thread_id}")
def get_plan(thread_id: str, request: Request):
    """Load a saved plan from the checkpoint."""
    config = {"configurable": {"thread_id": thread_id}}
    snapshot = request.app.state.graph.get_state(config)
    if not snapshot or not snapshot.values:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {
        "thread_id": thread_id,
        "user_query": snapshot.values.get("user_query", ""),
        **public_fields(snapshot.values),
    }

