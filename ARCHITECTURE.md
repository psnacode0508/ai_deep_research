# ARCHITECTURE.md

## DeepResearch — System Architecture

---

## Overview

DeepResearch is a multi-agent AI platform designed to answer complex research questions
through systematic web intelligence gathering, evidence extraction, contradiction detection,
and citation-backed report synthesis.

This document describes the intended architecture of the final system.
Components marked **[Planned]** are not yet implemented.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vercel)                        │
│                                                                  │
│   React + Vite + TypeScript + Tailwind CSS                       │
│   React Router · Framer Motion · shadcn/ui · Lucide React        │
└────────────────────────┬────────────────────────────────────────┘
                         │  HTTPS + SSE
┌────────────────────────▼────────────────────────────────────────┐
│                         BACKEND (Render)                         │
│                                                                  │
│   Node.js + Express + TypeScript                                 │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│   │   Routes    │  │ Controllers  │  │      Services        │  │
│   │  /health    │  │   health     │  │  ResearchService [P] │  │
│   │  /api/v1    │  │   sessions   │  │  AuthService     [P] │  │
│   │  /auth   [P]│  │   auth   [P] │  │  ReportService   [P] │  │
│   └─────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  RESEARCH ENGINE BOUNDARY                                │  │
│   │  engine/ — decoupled from HTTP layer                [P]  │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  BACKGROUND JOB BOUNDARY                                 │  │
│   │  jobs/ — BullMQ workers                             [P]  │  │
│   └──────────────────────────────────────────────────────────┘  │
└───────────┬──────────────────────┬──────────────────────────────┘
            │                      │
┌───────────▼──────────┐  ┌───────▼──────────────────────────────┐
│   Supabase (Cloud)   │  │   AI Research Engine            [P]  │
│                      │  │                                       │
│  PostgreSQL          │  │   LangGraph.js — agent orchestration  │
│  Supabase Auth   [P] │  │   Gemini API   — LLM reasoning        │
│  pgvector (opt)  [P] │  │   Tavily API   — live web search      │
└──────────────────────┘  └───────────────────────────────────────┘
            │
┌───────────▼──────────┐
│   Redis (Managed)    │  [P]
│   BullMQ job queue   │
└──────────────────────┘
```

**[P]** = Planned / not yet implemented

---

## Frontend

| Technology     | Role                                        |
|----------------|---------------------------------------------|
| React 19       | UI component model                          |
| Vite           | Build tool + dev server                     |
| TypeScript     | Type safety                                 |
| Tailwind CSS   | Utility-first styling                       |
| React Router   | Client-side routing                         |
| shadcn/ui      | Accessible, unstyled component primitives   |
| Framer Motion  | Animations and transitions                  |
| Lucide React   | Icon library                                |

---

## Backend

| Technology  | Role                                              |
|-------------|---------------------------------------------------|
| Node.js 20+ | Runtime                                           |
| Express     | HTTP framework                                    |
| TypeScript  | Type safety + compile-time correctness            |
| Helmet      | HTTP security headers                             |
| CORS        | Cross-origin request policy                       |

### Layer Separation

```
routes/       — HTTP route definitions only. No logic.
controllers/  — Parse request, call service, return response.
services/     — Business logic. No HTTP concerns.
engine/       — Research agent. No HTTP concerns. Can move to worker.
db/           — All persistence. Services call db/ only.
jobs/         — Background job dispatch and worker definitions.
config/       — All environment variable access is centralised here.
middleware/   — Express middleware: logging, errors, auth, 404.
```

---

## Research Engine [Planned]

The research engine is intentionally decoupled from the HTTP layer so it can run
as a background job (BullMQ worker) without changing its interface.

### Technology

| Technology   | Role                                   |
|--------------|----------------------------------------|
| LangGraph.js | Multi-agent graph orchestration        |
| Gemini API   | LLM for planning, synthesis, reasoning |
| Tavily API   | Real-time web search                   |

### Research Flow

```
User Question
     │
     ▼
┌─────────────┐
│   Planner   │  Gemini decomposes the question into N research tasks
└──────┬──────┘
       │  N parallel tasks
       ▼
┌─────────────────────────────────────────┐
│          Parallel Research              │
│  Tavily search → fetch pages → extract  │
│  evidence → score source credibility    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│           Evaluation                    │
│  Cross-check claims across sources      │
│  Detect contradictions                  │
│  Flag low-credibility sources           │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│           Reflection                    │
│  Assess research completeness           │
│  Identify gaps                          │
│  Decide: enough evidence OR follow-up?  │
└──────┬──────────────────────────────────┘
       │ (if gaps found)          │ (if complete)
       ▼                          ▼
┌─────────────┐          ┌─────────────────┐
│  Follow-Up  │          │   Synthesis     │
│  Research   │          │  Gemini builds  │
└──────┬──────┘          │  citation-backed│
       │ (feeds back)    │  Markdown report│
       │                 └────────┬────────┘
       └─────────────────►        │
                                  ▼
                         ┌────────────────┐
                         │ Human Approval │
                         └────────┬───────┘
                                  │
                                  ▼
                         ┌────────────────┐
                         │  Final Report  │
                         │  Save / Export │
                         └────────────────┘
```

### Prompt Injection Defence

Retrieved webpage content is treated as **data**, not instructions.
All web content will be sandboxed within a clearly marked data context
before being passed to any LLM call.

---

## Persistence [Planned]

| Technology      | Role                                           |
|-----------------|------------------------------------------------|
| Supabase        | Hosted PostgreSQL + Auth + realtime            |
| PostgreSQL       | Primary relational database                    |
| pgvector (opt)  | Vector embeddings if semantic search is needed |

### Data Isolation

Every research session is owned by a user. RLS (Row Level Security)
policies in Supabase ensure no cross-user data leakage.

---

## Authentication [Planned]

| Feature              | Technology            |
|----------------------|-----------------------|
| Email + password     | Supabase Auth         |
| Google OAuth         | Supabase Auth         |
| Email verification   | Supabase Auth         |
| Forgot/reset password| Supabase Auth         |
| Persistent sessions  | Supabase Auth JWT     |
| Protected routes     | React Router + Supabase session |

---

## Background Jobs [Planned]

| Technology | Role                                                  |
|------------|-------------------------------------------------------|
| BullMQ     | Distributed job queue                                 |
| Redis      | Fast in-memory broker backing BullMQ                  |

Long-running research sessions (potentially minutes) MUST NOT block
an HTTP request. The flow will be:

1. POST `/api/v1/sessions` → enqueue job → return `202 Accepted` + session ID
2. Worker picks up job → runs research engine → emits SSE events
3. Frontend subscribes to `GET /api/v1/sessions/:id/events` (SSE)
4. UI renders live progress driven by actual backend events

---

## Real-Time Progress [Planned]

Server-Sent Events (SSE) stream `ResearchEvent` objects to the frontend.
Each event corresponds to a real step in the research engine.

**No fake progress bars. All progress is driven by real engine events.**

---

## Deployment

| Component  | Platform       | Notes                                    |
|------------|----------------|------------------------------------------|
| Frontend   | Vercel         | Static site + edge functions if needed  |
| Backend    | Render         | Node.js web service, auto-deploy from Git|
| Database   | Supabase       | Managed PostgreSQL + Auth               |
| Redis      | Upstash / Redis Cloud | Managed Redis                    |

---

## Security Principles

1. All secrets stored in environment variables — never in source code
2. `.env` is gitignored — `.env.example` documents required vars
3. CORS restricted to known frontend origin(s)
4. Helmet sets appropriate HTTP security headers
5. Service-role Supabase key is backend-only — never sent to browser
6. Supabase RLS enforces per-user data isolation at DB level
7. Retrieved web content is treated as untrusted data (prompt injection defence)
8. All API endpoints that modify data will require auth (future milestone)

---

## Monorepo Structure

```
ai_deep_research/
├── apps/
│   ├── web/        Frontend — React + Vite + TypeScript
│   └── server/     Backend  — Node.js + Express + TypeScript
├── packages/
│   └── shared/     Shared TypeScript types (no runtime deps)
├── docs/           Documentation and ADRs
├── .env.example    Environment variable reference
├── .gitignore
├── package.json    npm workspaces root
├── README.md
└── ARCHITECTURE.md (this file)
```
