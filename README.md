# DeepResearch

**Multi-Agent AI Research & Web Intelligence Platform**

DeepResearch answers complex research questions through a systematic multi-agent pipeline:
web search → evidence extraction → source evaluation → contradiction detection → reflection → citation-backed report.

---

## Architecture Overview

```
Frontend (Vercel / React / Vite)  →  Backend API (Render / Node.js)  →  Research Engine (LangGraph.js)
                                            ↓                                 ↓
                                      Supabase (DB/Auth)               Gemini + Tavily
                                            ↓
                                  Redis + BullMQ (jobs)
                                            ↓
                                Backend Worker (Render / Node.js)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system design.

---

## Technology Stack

### Frontend
| Technology     | Version |
|----------------|---------|
| React          | 19      |
| Vite           | 6       |
| TypeScript     | 5.8     |
| Tailwind CSS   | 3       |
| React Router   | 7       |
| Framer Motion  | 12      |
| Lucide React   | latest  |

### Backend
| Technology  | Version |
|-------------|---------|
| Node.js     | ≥ 18    |
| Express     | 4       |
| TypeScript  | 5.4     |
| Helmet      | 7       |

### AI / Research
- **LangGraph.js** — multi-agent orchestration
- **Gemini API** — LLM reasoning and synthesis
- **Tavily API** — real-time web search

### Database / Auth
- **Supabase** — PostgreSQL + Auth

### Background Jobs
- **Redis + BullMQ** — decoupled reliable queue system

---

## Local Development Setup

### Prerequisites

- Node.js **18+**
- npm **9+**
- Redis Server (local or Docker: `docker run -p 6379:6379 -d redis`)

### 1. Clone the repository

```bash
git clone https://github.com/psnacode0508/ai_deep_research.git
cd ai_deep_research
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env and fill in your actual API keys, Supabase URLs, and Redis configurations.
```

### 3. Install all dependencies

```bash
npm install
```

### 4. Start the backend & worker

```bash
npm run dev:server
# Server starts at http://localhost:4000
# Health check: http://localhost:4000/health

# In a separate terminal, start the research worker:
cd apps/server && npm run worker
```

### 5. Start the frontend

```bash
npm run dev:web
# Frontend starts at http://localhost:5173
```

---

## Deployment & Production Configuration

The application is deployed across several managed services for scale and reliability:

### 1. Supabase (Database & Auth)
- Run migrations located in `supabase/migrations/` sequentially.
- Secure the `SUPABASE_SERVICE_ROLE_KEY` (never expose it to the client).

### 2. Redis (Production)
- Deploy a managed Redis instance (e.g., Aiven, Upstash, Render Redis).
- Expose the URL to the Render Backend API and Render Worker.

### 3. Render (Backend API)
- **Environment**: Node.js
- **Build Command**: `npm install && npm run build --workspaces`
- **Start Command**: `cd apps/server && npm run start`
- **Required Env Vars**: `NODE_ENV=production`, `PORT`, `FRONTEND_URL` (CORS), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `GEMINI_API_KEY`, `TAVILY_API_KEY`, `REDIS_URL`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`
- **Post-Deployment**: Check `https://<your-render-url>/health` to ensure `api`, `database`, and `redis` are all "ok".

### 4. Render (Backend Worker)
- **Environment**: Node.js Background Worker
- **Build Command**: `npm install && npm run build --workspaces`
- **Start Command**: `cd apps/server && node dist/worker.js`
- **Required Env Vars**: Same as Backend API (excluding `PORT` and `FRONTEND_URL`).

### 5. Vercel (Frontend Web)
- **Environment**: React / Vite
- **Build Command**: `npm run build:web`
- **Output Directory**: `apps/web/dist`
- **Required Env Vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (pointing to the Render Backend API).

---

## Available Scripts

From the repository root:

| Command               | Description                          |
|-----------------------|--------------------------------------|
| `npm run dev:web`     | Start frontend dev server            |
| `npm run dev:server`  | Start backend dev server             |
| `cd apps/server && npm run worker` | Start the background research worker |
| `npm run build:web`   | Build frontend for production        |
| `npm run build:server`| Compile backend TypeScript           |
| `npm run build`       | Build workspaces globally            |
| `npm run type-check`  | Type-check all packages              |
| `npm run test`        | Run Vitest test suites               |

---

## License

MIT
