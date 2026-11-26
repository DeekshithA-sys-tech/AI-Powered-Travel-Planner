"""Web search via Tavily. Used by the hotel agent."""

import os

from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv()

_api_key = os.getenv("TAVILY_API_KEY")
if not _api_key:
    raise ValueError("TAVILY_API_KEY is missing in .env file")

_client = TavilyClient(api_key=_api_key)


def tavily_search(query: str, max_results: int = 5) -> str:
    """Search the web and return a compact text summary of the top results."""
    response = _client.search(
        query=query,
        max_results=max_results,
        include_answer=True,
    )

    results = []
    if response.get("answer"):
        results.append(f"Summary: {response['answer']}")

    for i, res in enumerate(response.get("results", []), start=1):
        title = res.get("title", "unknown")
        url = res.get("url", "")
        snippet = (res.get("content") or res.get("context") or "").strip()

        if len(snippet) > 300:
            snippet = snippet[:300].rsplit(" ",1)[0] + "..."

        results.append(f"Result {i}: {title} ({url})\n\n{snippet}")
    return "\n\n".join(results) if results else "No results found."
