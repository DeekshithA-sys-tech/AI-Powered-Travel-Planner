# AI-Powered Travel Planner

A full-stack multi-agent travel planning application built with **LangGraph**, **FastAPI**, **PostgreSQL**, **Groq**, **Tavily**, **AviationStack**, and **React (Vite + Tailwind CSS)**.

The planner orchestrates four specialized agents sequentially and streams live step-by-step progress to the frontend over Server-Sent Events (SSE).

---

## Live Deployment (Railway)

- **Live App (Frontend):** https://frontend-production-d5e55587.up.railway.app
- **Backend API:** https://backend-production-b7b1ed21.up.railway.app
- **API Docs (Swagger):** https://backend-production-b7b1ed21.up.railway.app/docs
- **Health Check:** https://backend-production-b7b1ed21.up.railway.app/api/health
- **GitHub Repository:** https://github.com/DeekshithA-sys-tech/AI-Powered-Travel-Planner

---

## Architecture

```
User Query ─▶ POST /api/plan/stream (FastAPI SSE)
                   │
                   ▼
             LangGraph Pipeline (PostgresSaver Checkpointer)
               1. flight_agent    ──▶ AviationStack IATA search (+ Tavily fallback)
               2. hotel_agent     ──▶ Tavily accommodation search
               3. itinerary_agent ──▶ Groq LLM day-by-day draft
               4. final_agent     ──▶ Groq LLM structured Markdown travel plan
```

### Tech Stack

| Layer | Technology |
| --- | --- |
| **Orchestration** | LangGraph, LangChain Core |
| **LLM** | Groq (`langchain-groq`) |
| **Persistence** | PostgreSQL (`psycopg` + `langgraph-checkpoint-postgres`) |
| **Flight & Hotel Data** | AviationStack API, Tavily Search API |
| **Backend API** | FastAPI, Uvicorn, Pydantic (SSE streaming) |
| **Frontend** | React 18, Vite 6, Tailwind CSS v4, `react-markdown`, `remark-gfm`, Axios |

---

## Project Structure

```text
AI Travel Planner/
├── backend/
│   ├── tools/
│   │   ├── flight_tool.py      # Route IATA lookup, AviationStack query & Tavily fallback
│   │   └── tavily_tool.py      # Tavily web search wrapper
│   ├── main.py                 # FastAPI app, lifespan Postgres pool, SSE & plan endpoints
│   ├── travel_graph.py         # LangGraph TravelState, agent nodes & retry handling
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios client & fetch-based SSE stream parser
│   │   ├── components/         # Sidebar, HeroBanner, SearchForm, ProgressSteps, PlanResult, HistoryList
│   │   ├── hooks/              # useStreamingPlan SSE state hook
│   │   ├── lib/                # LocalStorage history helper
│   │   ├── App.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── .env.example            # Frontend environment template
├── .gitignore
└── README.md
```

---

## Local Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and `npm`
- **PostgreSQL** instance (local or managed)
- API keys for **Groq**, **Tavily**, and **AviationStack**

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Update `backend/.env` with your credentials:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/travel_planner
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
TAVILY_API_KEY=your_tavily_api_key
AVIATIONSTACK_API_KEY=your_aviationstack_api_key
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Start the FastAPI server:

```bash
uvicorn main:app --reload --port 8000
```

API docs are available at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check (`{"status": "ok"}`) |
| `POST` | `/api/plan/stream` | Run the 4-agent LangGraph pipeline and stream SSE events (`start`, `step_start`, `step_done`, `complete`, `error`) |
| `GET` | `/api/plan/{thread_id}` | Fetch a saved travel plan from PostgreSQL checkpoints |

---

## Hosting / Deployment

This project is deployed as a three-service stack on **Railway** (`ai-powered-travel-planner`):

1. **PostgreSQL**: Managed Railway Postgres (`Postgres` template) wired to the backend via `${{Postgres.DATABASE_URL}}`.
2. **Backend (FastAPI)**: Root directory `/backend`, built with Railpack (Python 3.12), started with:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
   Environment variables: `DATABASE_URL`, `GROQ_API_KEY`, `GROQ_MODEL`, `TAVILY_API_KEY`, `AVIATIONSTACK_API_KEY`, and `ALLOWED_ORIGINS`.
3. **Frontend (React/Vite)**: Root directory `/frontend`, built with `npm run build` (`dist/`), served with Railpack static/SPA hosting (`RAILPACK_STATIC_FILE_ROOT=dist`, `RAILPACK_SPA_OUTPUT_DIR=dist`) and `VITE_API_URL` pointing to the deployed backend URL.
