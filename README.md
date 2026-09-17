# DeepResearch

**Multi-Agent AI Research & Web Intelligence Platform**

DeepResearch answers complex research questions through a systematic multi-agent pipeline:
web search → evidence extraction → source evaluation → contradiction detection → reflection → citation-backed report.

> ⚠️ **Milestone 0** — This repository currently contains the project foundation only.
> The research engine, authentication, database, and real-time features are planned for future milestones.

---

## Architecture Overview

```
Frontend (React/Vite)  →  Backend (Node/Express)  →  Research Engine (LangGraph.js)
                                   ↓                          ↓
                            Supabase (DB/Auth)          Gemini + Tavily
                                   ↓
                         Redis + BullMQ (jobs)
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

### AI / Research (Planned)
- **LangGraph.js** — multi-agent orchestration
- **Gemini API** — LLM reasoning and synthesis
- **Tavily API** — real-time web search

### Database / Auth (Planned)
- **Supabase** — PostgreSQL + Auth

### Background Jobs (Planned)
- **Redis + BullMQ**

---

## Local Development Setup

### Prerequisites

- Node.js **18+**
- npm **9+**

### 1. Clone the repository

```bash
git clone https://github.com/psnacode0508/ai_deep_research.git
cd ai_deep_research
```

### 2. Configure environment variables

```bash
cp .env.example apps/server/.env
# Edit apps/server/.env and fill in your values
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

## Environment Variables

Copy `.env.example` to `apps/server/.env` (backend) and to `apps/web/.env` (frontend). Ensure Redis is running locally (e.g. `docker run -p 6379:6379 -d redis`).

| Variable                   | Where    | Description                              |
|----------------------------|----------|------------------------------------------|
| `PORT`                     | Server   | Express server port (default: 4000)      |
| `NODE_ENV`                 | Server   | `development` or `production`            |
| `FRONTEND_URL`             | Server   | CORS allowed origin                      |
| `SUPABASE_URL`             | Server   | Supabase project URL                     |
| `SUPABASE_SERVICE_ROLE_KEY`| Server   | Supabase service-role key (secret)       |
| `DATABASE_URL`             | Server   | PostgreSQL connection string             |
| `GEMINI_API_KEY`           | Server   | Google Gemini API key                    |
| `GEMINI_MODEL`             | Server   | Gemini model name (e.g. `gemini-2.0-flash`) |
| `TAVILY_API_KEY`           | Server   | Tavily Search API key                    |
| `REDIS_URL`                | Server   | Redis connection URL (default: redis://localhost:6379) |
| `VITE_SUPABASE_URL`        | Frontend | Supabase project URL (public)            |
| `VITE_SUPABASE_ANON_KEY`   | Frontend | Supabase anon key (public)               |
| `VITE_API_URL`             | Frontend | Backend API base URL                     |

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
| `npm run type-check`  | Type-check all packages              |

---

## Project Structure

```
ai_deep_research/
├── apps/
│   ├── web/            # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── layouts/      # Layout shells
│   │   │   ├── pages/        # Page-level components
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── lib/          # Utilities
│   │   │   └── types/        # Frontend-specific types
│   │   └── ...
│   └── server/         # Node.js + Express backend
│       └── src/
│           ├── config/       # Environment config
│           ├── controllers/  # HTTP handlers
│           ├── routes/       # Route definitions
│           ├── services/     # Business logic
│           ├── middleware/   # Express middleware
│           ├── engine/       # Research engine boundary
│           ├── db/           # Database boundary
│           └── jobs/         # Background jobs boundary
├── packages/
│   └── shared/         # Shared TypeScript types
├── docs/
├── .env.example
├── ARCHITECTURE.md
└── README.md
```

---

## Implementation Status

| Feature                      | Status       |
|------------------------------|--------------|
| Project structure / monorepo | ✅ Complete   |
| Shared TypeScript types      | ✅ Complete   |
| Express server + health API  | ✅ Complete   |
| Frontend shell               | ✅ Complete   |
| Tailwind + Framer Motion     | ✅ Complete   |
| Architecture documentation   | ✅ Complete   |
| Authentication               | 🔲 Planned    |
| Database schema              | 🔲 Planned    |
| Research engine              | 🔲 Planned    |
| Web search (Tavily)          | 🔲 Planned    |
| LangGraph.js agents          | 🔲 Planned    |
| Background jobs (BullMQ)     | 🔲 Planned    |
| Real-time progress (SSE)     | 🔲 Planned    |
| Report generation            | 🔲 Planned    |
| Export (PDF/DOCX)            | 🔲 Planned    |
| Deployment                   | 🔲 Planned    |

---

## Roadmap

- **Milestone 0** ✅ — Project foundation
- **Milestone 1** — Authentication (Supabase Auth + protected routes)
- **Milestone 2** — Database schema + session persistence
- **Milestone 3** — Research engine v1 (Gemini + Tavily, basic pipeline)
- **Milestone 4** — Multi-agent pipeline (LangGraph.js, parallel research, reflection)
- **Milestone 5** — Background jobs + SSE progress streaming
- **Milestone 6** — Report synthesis + citation validation
- **Milestone 7** — Export (PDF/DOCX/Markdown)
- **Milestone 8** — Deployment (Vercel + Render + Supabase)

---

## Contributing

This is currently a solo project under active development.
Contribution guidelines will be added when the project reaches a stable milestone.

---

## License

MIT
