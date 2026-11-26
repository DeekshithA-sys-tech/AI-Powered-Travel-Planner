# AI Travel Planner – Frontend

React + Vite + Tailwind v4 + axios. Streams progress from the FastAPI backend over SSE.

    cp .env.example .env     # set VITE_API_URL if the backend is not on :8000
    npm install
    npm run dev              # http://localhost:5173

The backend must be running (`uvicorn main:app --reload --port 8000`) with CORS allowing http://localhost:5173.
