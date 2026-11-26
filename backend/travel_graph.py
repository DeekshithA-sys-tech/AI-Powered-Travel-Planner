"""LangGraph travel planner: state, agents and graph builder.

No I/O at import time except loading env vars, so FastAPI can import it.
The graph is compiled once at app startup with a Postgres checkpointer.
"""

import os
import re
import time
import operator
from typing import TypedDict, Annotated

from dotenv import load_dotenv
from groq import RateLimitError
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import (
    SystemMessage,
    HumanMessage,
    AIMessage,
    AnyMessage,
)
from langchain_groq import ChatGroq

from tools.tavily_tool import tavily_search
from tools.flight_tool import search_flights
load_dotenv()

if not os.getenv("GROQ_API_KEY"):
    raise ValueError("GROQ_API_KEY is missing in .env file")

llm = ChatGroq(
    model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
    temperature=0.3,
)

# Order of nodes, used by the API to report progress to the frontend.
PIPELINE = ["flight_agent", "hotel_agent", "itinerary_agent", "final_agent"]

# State keys that are safe/useful to send to the client (messages are not).
PUBLIC_KEYS = ["flight_results", "hotel_results", "itinerary", "final_plan", "llm_calls"]


class TravelState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    user_query: str
    flight_results: str
    hotel_results: str
    itinerary: str
    final_plan: str
    llm_calls: int


MAX_TOOL_CONTEXT_CHARS = 3000
_RETRY_AFTER_RE = re.compile(r"try again in\s+([0-9]+(?:\.[0-9]+)?)(ms|s)", re.IGNORECASE)


def _truncate(text: str, max_chars: int = MAX_TOOL_CONTEXT_CHARS) -> str:
    """Trim oversized tool output to stay within LLM token limits."""
    if not text or len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0] + "\n...[truncated]"


def _invoke_llm(messages: list[AnyMessage], max_retries: int = 2):
    """Invoke the LLM, honoring short Groq TPM retry-after windows on 429 errors."""
    for attempt in range(max_retries + 1):
        try:
            return llm.invoke(messages)
        except RateLimitError as exc:
            if attempt >= max_retries:
                raise
            match = _RETRY_AFTER_RE.search(str(exc))
            if match:
                val = float(match.group(1))
                delay = (val / 1000.0) if match.group(2).lower() == "ms" else val
            else:
                delay = 5.0 * (attempt + 1)
            if delay > 30.0:
                raise
            time.sleep(min(delay + 0.5, 30.5))


def flight_agent(state: TravelState):
    flight_data = search_flights(state["user_query"])
    return {
        "flight_results": str(flight_data),
        "messages": [AIMessage(content="Flight results fetched successfully.")],
    }


def hotel_agent(state: TravelState):
    query = f"Best hotels and accommodation options for {state['user_query']}"
    hotel_data = tavily_search(query)
    return {
        "hotel_results": str(hotel_data),
        "messages": [AIMessage(content="Hotel results fetched successfully.")],
    }


def itinerary_agent(state: TravelState):
    prompt = f"""
Create a detailed travel itinerary based on the following information.

User Query:
{state['user_query']}

Flight Results:
{_truncate(state['flight_results'])}

Hotel Results:
{_truncate(state['hotel_results'])}

Include:
1. Travel overview.
2. Recommended daily activities.
3. Places to visit.
4. Suggested travel schedule.
5. Estimated expenses where information is available.

Keep each day concise (3-4 short bullet points) so the draft stays compact.
Do not invent flight prices or hotel availability.
Clearly mention when information is unavailable.
Use pure Markdown only; do not use HTML tags such as <br>.
"""
    response = _invoke_llm(
        [
            SystemMessage(content="You are an expert travel planner."),
            HumanMessage(content=prompt),
        ]
    )
    return {
        "itinerary": response.content,
        "messages": [response],
        "llm_calls": state.get("llm_calls", 0) + 1,
    }


def final_agent(state: TravelState):
    final_prompt = f"""
Generate a complete and organized final travel plan in Markdown.

User Request:
{state['user_query']}

Flight Information:
{_truncate(state['flight_results'])}

Hotel Information:
{_truncate(state['hotel_results'])}

Travel Itinerary:
{_truncate(state['itinerary'], 8000)}

Organize the response into these sections (use ## headings):
1. Travel Summary
2. Flight Details
3. Hotel Recommendations
4. Day-by-Day Itinerary
5. Estimated Budget
6. Important Travel Tips

Use only the information provided.
Do not fabricate booking confirmations or availability.
Use pure Markdown only (no HTML tags like <br>; keep table cells single-line or use bullet lists instead).
"""
    response = _invoke_llm(
        [
            SystemMessage(content="You are a professional travel planning assistant."),
            HumanMessage(content=final_prompt),
        ]
    )
    return {
        "final_plan": response.content,
        "messages": [response],
        "llm_calls": state.get("llm_calls", 0) + 1,
    }


def build_graph(checkpointer):
    """Build and compile the graph with the given checkpointer."""
    graph = StateGraph(TravelState)

    graph.add_node("flight_agent", flight_agent)
    graph.add_node("hotel_agent", hotel_agent)
    graph.add_node("itinerary_agent", itinerary_agent)
    graph.add_node("final_agent", final_agent)

    graph.add_edge(START, "flight_agent")
    graph.add_edge("flight_agent", "hotel_agent")
    graph.add_edge("hotel_agent", "itinerary_agent")
    graph.add_edge("itinerary_agent", "final_agent")
    graph.add_edge("final_agent", END)

    return graph.compile(checkpointer=checkpointer)


def initial_state(user_query: str) -> dict:
    return {
        "messages": [HumanMessage(content=user_query)],
        "user_query": user_query,
        "flight_results": "",
        "hotel_results": "",
        "itinerary": "",
        "final_plan": "",
        "llm_calls": 0,
    }