# CurveAI Backend — CLAUDE.md

## Project Overview
Python FastAPI backend for CurveAI. Handles auth, client management, audit orchestration,
AI agent pipelines, and integrations with contact center platforms and AI services.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| API Framework | FastAPI 0.115 |
| Language | Python 3.11+ |
| ORM | SQLAlchemy 2.0 (async) |
| Database | PostgreSQL (asyncpg driver) |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| AI / LLM | Anthropic Claude claude-sonnet-4-6 |
| Agent Orchestration | LangGraph |
| Speech-to-Text | Deepgram SDK |
| Cache / Queue | Redis |
| Object Storage | AWS S3 (boto3) |
| Local Analytics | DuckDB |
| Error Tracking | Sentry |

## Directory Structure
```
backend/
├── app/
│   ├── main.py                  # FastAPI app, CORS, router registration
│   ├── core/
│   │   ├── config.py            # Pydantic Settings (reads .env)
│   │   └── database.py          # Async engine + session factory + Base
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── client.py            # Client, Audit, DataCollection, Gap
│   │   ├── user.py              # User (auth)
│   │   └── industry_player.py   # IndustryPlayer (reference data)
│   ├── schemas/                 # Pydantic request/response schemas
│   │   └── client.py
│   ├── api/v1/endpoints/        # Route handlers
│   │   ├── auth.py              # POST /auth/register, POST /auth/login
│   │   ├── clients.py           # CRUD + audit + gaps + data-collection
│   │   └── industry_players.py  # GET /industry-players
│   ├── agents/                  # Claude-powered AI agents
│   │   └── research_agent.py    # Research + gap analysis agents
│   └── services/                # Business logic (to be expanded)
├── migrations/
│   └── seed_industry_players.py # Seeds 80+ industry players into DB
├── tests/
├── requirements.txt
├── .env.example
└── CLAUDE.md
```

## Data Models

### Client
Stores company profile from onboarding: name, industry, contact info, platform, metrics.

### Audit
One per client engagement. Tracks status: `pending → data_collection → analysis → report_ready → completed`.
Stores overall capability score, gap counts, and financial estimates.

### DataCollection
Tracks receipt status of each data item required for audit (13 items, each: `pending|partial|done|failed`).
Has a computed `completion_percentage` property — shown in admin portal.

### Gap
One row per identified gap. Stores feature name, category, severity, current/ideal state,
business impact, fix difficulty, timeline, ROI estimate, and solution design.

### IndustryPlayer
Reference table of 80+ contact center vendors across 10 categories. Used for platform
identification during onboarding and audit research. Seeded once via migration script.

## Running
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # Fill in keys
uvicorn app.main:app --reload  # http://localhost:8000
```

## Environment Variables (.env)
```
DATABASE_URL=postgresql+asyncpg://curveai:curveai@localhost:5432/curveai
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-...
DEEPGRAM_API_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=curveai-recordings
SECRET_KEY=change-me-in-production
FRONTEND_URL=http://localhost:3000
```

## AI Agents

### Research Agent (`app/agents/research_agent.py`)
- `research_platform(client_data)` — analyzes platform config against 100-feature framework
- `analyze_gaps(research_output, client_context)` — produces prioritized gap list with ROI
- Uses `claude-sonnet-4-6` (Sonnet 4.6) for all inference
- Returns structured JSON for storage in `Gap` table

### Planned Agents (not yet built)
- **Solution Design Agent** — generates detailed solution design per gap
- **Build Agent** — executes platform configuration changes via CC APIs
- **Optimization Agent** — monthly monitoring loop, auto-implements quick wins

## API Routes
```
GET  /health
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/clients
POST /api/v1/clients
GET  /api/v1/clients/{id}
GET  /api/v1/clients/{id}/audit
GET  /api/v1/clients/{id}/gaps?severity=Critical
GET  /api/v1/clients/{id}/data-collection
GET  /api/v1/industry-players?category=Cloud+Platform
GET  /api/v1/industry-players/categories
```

## Industry Players
80+ vendors across 10 categories seeded in `migrations/seed_industry_players.py`:
- Cloud Platform (25 vendors: Genesys, Amazon Connect, Five9, NICE, Talkdesk, etc.)
- On-Premise (7: Genesys PureConnect, Avaya Aura, Cisco UCCE, etc.)
- Speech AI (8: Deepgram, AssemblyAI, Nuance, Google CCAI, etc.)
- Conversational AI (6: IBM Watson, LivePerson, Kore.ai, etc.)
- Analytics (10: Verint, Calabrio, Observe.AI, Tethr, etc.)
- Real-Time AI (4: Cogito, Balto, Cresta, Assembled)
- Workforce Management (8: NICE IEX, Verint WFM, Calabrio, etc.)
- CRM (8: Salesforce, HubSpot, Zendesk, ServiceNow, etc.)
- CX Platform (4: Sprinklr, Khoros, Gladly, Kustomer)
- Fraud & Identity (4: Nuance Gatekeeper, Pindrop, etc.)

## 100-Feature Framework Categories
1. Inbound Call Handling (15 features)
2. Compliance & Risk (12 features)
3. Analytics & Insights (15 features)
4. Integration & Data (12 features)
5. Automation & AI (15 features)
6. Customer Experience (13 features)
7. Agent Experience (10 features)
8. Business Operations (8 features)

## Adding New Endpoints
1. Create schema in `app/schemas/`
2. Create route handler in `app/api/v1/endpoints/`
3. Register router in `app/main.py`
4. Add model if new DB table needed
