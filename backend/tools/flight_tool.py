"""Flight search via Aviationstack (by IATA route) with Tavily web fallback."""

import os
import re
import requests
from dotenv import load_dotenv

load_dotenv()

_api_key = os.getenv("AVIATIONSTACK_API_KEY")

if not _api_key:
    raise ValueError("AVIATIONSTACK_API_KEY is missing in .env file")

# Map common cities, regions, and common spellings to IATA airport codes.
CITY_TO_IATA: dict[str, list[str]] = {
    "bengaluru": ["BLR"],
    "bangalore": ["BLR"],
    "bengalore": ["BLR"],
    "banglore": ["BLR"],
    "blr": ["BLR"],
    "goa": ["GOI", "GOX"],
    "dabolim": ["GOI"],
    "mopa": ["GOX"],
    "goi": ["GOI"],
    "gox": ["GOX"],
    "mumbai": ["BOM"],
    "bombay": ["BOM"],
    "bom": ["BOM"],
    "delhi": ["DEL"],
    "new delhi": ["DEL"],
    "del": ["DEL"],
    "hyderabad": ["HYD"],
    "hyd": ["HYD"],
    "chennai": ["MAA"],
    "madras": ["MAA"],
    "maa": ["MAA"],
    "kolkata": ["CCU"],
    "calcutta": ["CCU"],
    "ccu": ["CCU"],
    "pune": ["PNQ"],
    "kochi": ["COK"],
    "cochin": ["COK"],
    "kerala": ["COK", "TRV"],
    "trivandrum": ["TRV"],
    "thiruvananthapuram": ["TRV"],
    "coorg": ["MYQ", "CNN", "BLR"],
    "mysuru": ["MYQ"],
    "mysore": ["MYQ"],
    "manali": ["KUU", "IXC"],
    "kullu": ["KUU"],
    "chandigarh": ["IXC"],
    "shimla": ["SLV", "IXC"],
    "jaipur": ["JAI"],
    "udaipur": ["UDR"],
    "ahmedabad": ["AMD"],
    "varanasi": ["VNS"],
    "amritsar": ["ATQ"],
    "srinagar": ["SXR"],
    "leh": ["IXL"],
    "andaman": ["IXZ"],
    "port blair": ["IXZ"],
    "tokyo": ["HND", "NRT"],
    "japan": ["HND", "NRT", "KIX"],
    "osaka": ["KIX"],
    "paris": ["CDG", "ORY"],
    "france": ["CDG"],
    "dubai": ["DXB"],
    "abu dhabi": ["AUH"],
    "bangkok": ["BKK", "DMK"],
    "thailand": ["BKK", "HKT"],
    "phuket": ["HKT"],
    "rome": ["FCO"],
    "italy": ["FCO", "MXP"],
    "milan": ["MXP"],
    "bali": ["DPS"],
    "denpasar": ["DPS"],
    "singapore": ["SIN"],
    "london": ["LHR", "LGW"],
    "uk": ["LHR"],
    "new york": ["JFK", "EWR"],
    "tokyo narita": ["NRT"],
    "haneda": ["HND"],
}

_CITY_KEYS = sorted(CITY_TO_IATA.keys(), key=len, reverse=True)
_FROM_RE = re.compile(
    r"\bfrom\s+([a-zA-Z\s]{2,40}?)(?=\s+(?:to|under|for|with|in|on|at|budget|days?|nights?|trip|flights?)\b|[,.;!?]|$)",
    re.IGNORECASE,
)
_TO_RE = re.compile(
    r"\b([a-zA-Z\s]{2,30}?)\s+to\s+([a-zA-Z\s]{2,30}?)(?=\s+(?:under|for|with|in|on|at|budget|days?|nights?|trip|flights?)\b|[,.;!?]|$)",
    re.IGNORECASE,
)
_IATA_TOKEN_RE = re.compile(r"\b([A-Z]{3})\b")


def _lookup_iata(text: str) -> list[str]:
    """Find matching IATA codes in a text snippet using CITY_TO_IATA or uppercase 3-letter codes."""
    lowered = text.lower()
    for key in _CITY_KEYS:
        if re.search(rf"\b{re.escape(key)}\b", lowered):
            return CITY_TO_IATA[key]
    for code in _IATA_TOKEN_RE.findall(text):
        if code not in {"INR", "USD", "EUR", "GBP"}:
            return [code]
    return []


def _extract_route(query: str) -> tuple[list[str], list[str]]:
    """Extract (dep_iatas, arr_iatas) from a natural-language travel query."""
    dep_iatas: list[str] = []
    arr_iatas: list[str] = []
    remaining = query

    from_match = _FROM_RE.search(query)
    if from_match:
        dep_iatas = _lookup_iata(from_match.group(1))
        remaining = (query[:from_match.start()] + " " + query[from_match.end():]).strip()

    to_match = _TO_RE.search(remaining)
    if to_match:
        to_arr = _lookup_iata(to_match.group(2))
        if to_arr:
            if not dep_iatas:
                dep_iatas = _lookup_iata(to_match.group(1))
            arr_iatas = to_arr

    if not arr_iatas:
        arr_iatas = _lookup_iata(remaining)

    # Avoid matching the same airport as both origin and destination.
    if dep_iatas and arr_iatas and set(dep_iatas) == set(arr_iatas):
        arr_iatas = []

    return dep_iatas, arr_iatas


def _format_flight(flight: dict) -> str:
    airline_info = flight.get("airline") or {}
    flight_info = flight.get("flight") or {}
    dep_info = flight.get("departure") or {}
    arr_info = flight.get("arrival") or {}

    airline = airline_info.get("name") or "Unknown Airline"
    flight_num = flight_info.get("iata") or flight_info.get("number") or ""
    departure = dep_info.get("airport") or "Unknown"
    dep_iata = dep_info.get("iata") or ""
    arrival = arr_info.get("airport") or "Unknown"
    arr_iata = arr_info.get("iata") or ""
    scheduled = dep_info.get("scheduled") or "N/A"
    status = flight.get("flight_status") or "unknown"

    dep_label = f"{departure} ({dep_iata})" if dep_iata else departure
    arr_label = f"{arrival} ({arr_iata})" if arr_iata else arrival
    flight_label = f"{airline} {flight_num}".strip()

    return (
        f"Flight: {flight_label}\n"
        f"Route: {dep_label} -> {arr_label}\n"
        f"Scheduled: {scheduled}\n"
        f"Status: {status}"
    )


def _tavily_flight_fallback(query: str) -> str:
    try:
        from tools.tavily_tool import tavily_search
    except ImportError:
        from .tavily_tool import tavily_search
    return tavily_search(f"Flights airlines routes and typical fares for {query}", max_results=5)


def search_flights(query: str) -> str:
    """Fetch up to 5 matching flights from Aviationstack by IATA route, with Tavily fallback."""
    dep_iatas, arr_iatas = _extract_route(query)

    if not dep_iatas and not arr_iatas:
        return _tavily_flight_fallback(query)

    url = "http://api.aviationstack.com/v1/flights"
    dep_candidates = dep_iatas or [None]
    arr_candidates = arr_iatas or [None]

    flights: list[str] = []
    seen: set[str] = set()

    for dep in dep_candidates:
        for arr in arr_candidates:
            params: dict[str, object] = {"access_key": _api_key, "limit": 5}
            if dep:
                params["dep_iata"] = dep
            if arr:
                params["arr_iata"] = arr

            try:
                response = requests.get(url, params=params, timeout=15)
                response.raise_for_status()
                data = response.json()
            except Exception:
                continue

            if "error" in data:
                continue

            for flight in (data.get("data") or [])[:5]:
                dep_code = (flight.get("departure") or {}).get("iata") or ""
                arr_code = (flight.get("arrival") or {}).get("iata") or ""
                if dep and dep_code and dep_code.upper() != dep:
                    continue
                if arr and arr_code and arr_code.upper() != arr:
                    continue
                formatted = _format_flight(flight)
                if formatted not in seen:
                    seen.add(formatted)
                    flights.append(formatted)
                if len(flights) >= 5:
                    break
            if len(flights) >= 5:
                break
        if len(flights) >= 5:
            break

    if flights:
        return "\n\n".join(flights)

    return _tavily_flight_fallback(query)