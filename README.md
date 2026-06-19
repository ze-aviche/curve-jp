# OptimizeCC

AI-powered contact center audit platform. Identifies $500K–$2M in improvement opportunities and delivers a prioritized roadmap.

## Stack

- **Frontend:** Next.js 16.2.6 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Recharts · Framer Motion
- **Backend:** FastAPI (Python) · PostgreSQL · SQLAlchemy 2.0 · JWT auth · Claude AI agents
- **Package manager:** pnpm

## Getting Started

### Frontend

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

> First run: pnpm may prompt `pnpm approve-builds` for `sharp` and `msw` — run it and select all.

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env    # set DATABASE_URL, SECRET_KEY, ANTHROPIC_API_KEY
uvicorn app.main:app --reload   # http://localhost:8000
```

## Pages

| Route | Description |
|---|---|
| `/` | Marketing landing page |
| `/login` | Sign in |
| `/onboarding` | 6-step audit intake wizard |
| `/dashboard` | Customer audit dashboard |
| `/audit` | Full gap report |
| `/admin/dashboard` | Admin — all clients overview |
| `/admin/clients` | Admin — client management |

## Project Docs

See [CLAUDE.md](./CLAUDE.md) for full architecture, design decisions, what's done, and what's next.
