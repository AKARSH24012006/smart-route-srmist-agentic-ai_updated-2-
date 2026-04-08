# Smart Route SRMist

A full-stack agentic AI travel planner built with React, Vite, and Express.

## Features

- React frontend with a futuristic multi-agent travel-planning interface
- Express backend with `/api/health` and `/api/plan`
- Live geocoding and weather data via Open-Meteo APIs
- AI-compatible backend layer using environment variables
- Works immediately in `mock` mode, then upgrades to real AI when configured

## Run

1. Copy `.env.example` to `.env` if you want to customize provider settings.
2. Install dependencies with `npm install`.
3. Start both frontend and backend with `npm run dev`.

Frontend: `http://localhost:5173`

Backend: `http://localhost:8787`

## Real AI mode

Set these environment variables in `.env`:

- `AI_PROVIDER=openai-compatible`
- `AI_API_KEY=your_key`
- `AI_BASE_URL=your_provider_chat_completions_endpoint`
- `AI_MODEL=your_model_name`

If those are missing, the app falls back to the built-in mock planner while still using live geocoding and weather APIs.
