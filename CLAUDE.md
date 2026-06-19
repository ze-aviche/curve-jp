# CLAUDE.md — OptimizeCC Project Context

## What This Project Is

**OptimizeCC** — a B2B SaaS product that delivers AI-powered contact center audits. Identifies $500K–$2M in improvement opportunities and delivers a prioritized roadmap quickly.

This repo is the **marketing site + customer/admin portal**, rebuilt in v0.app's pnpm/Next.js structure after an earlier prototype (D:\projects\CurveAI) was abandoned due to UI quality.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Language | TypeScript 5.7.3 |
| Styling | Tailwind CSS v4 + `tw-animate-css` |
| UI Components | shadcn/ui, `@base-ui/react` |
| Charts | Recharts 3.8.1 |
| Animations | Framer Motion 12.40.0 |
| Icons | Lucide React |
| Package Manager | pnpm |
| Analytics | Vercel Analytics (production only) |
| Backend | FastAPI (Python) — see `backend/` |

---

## Project Structure

```
curve-jp/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Marketing landing page (single page)
│   ├── login/page.tsx          # Sign-in
│   ├── onboarding/page.tsx     # 6-step audit onboarding wizard
│   ├── dashboard/              # Customer portal
│   │   ├── layout.tsx          # Wraps with CustomerSidebar
│   │   └── page.tsx            # Dashboard with KPIs, charts, activity
│   ├── audit/page.tsx          # Dark-themed audit report with gap cards
│   └── admin/
│       ├── dashboard/page.tsx  # Admin overview (clients, data collection)
│       └── clients/page.tsx    # Client management grid
├── components/
│   ├── site-header.tsx         # Marketing nav (sticky, dropdown menus)
│   ├── site-footer.tsx
│   ├── hero.tsx                # Hero section w/ scrolling client marquee
│   ├── problem-stats.tsx
│   ├── solution.tsx            # 3-phase: Audit → Analyze → Implement
│   ├── how-it-works.tsx        # 3-step simplified (no week-by-week)
│   ├── case-studies.tsx
│   ├── roi-calculator.tsx
│   ├── testimonials.tsx
│   ├── comparison.tsx
│   ├── cta-form.tsx
│   ├── customer-sidebar.tsx    # Customer portal sidebar nav
│   ├── admin-sidebar.tsx       # Admin portal sidebar nav
│   └── ui/                     # shadcn primitives
│       ├── button.tsx
│       ├── badge.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       └── progress.tsx
├── lib/
│   ├── utils.ts                # cn() helper
│   ├── data.ts                 # Categories data for charts (8 categories w/ scores)
│   └── api.ts                  # Typed API client → FastAPI backend
├── backend/                    # FastAPI backend (copied from CurveAI)
│   ├── app/
│   │   ├── main.py
│   │   ├── api/v1/endpoints/   # auth, clients, industry_players
│   │   ├── models/             # SQLAlchemy: User, Client, Audit, Gap, DataCollection
│   │   ├── agents/             # Claude-powered research + gap analysis agents
│   │   └── core/               # config, database setup
│   ├── migrations/             # seed_industry_players.py (80+ vendors)
│   └── requirements.txt
├── public/images/
│   ├── audit-dashboard.png     # Hero screenshot
│   └── founder.png             # NOT used (founder section removed)
└── app/globals.css             # Tailwind + custom marquee animation
```

---

## Design Decisions Made

### Marketing Site Removals (user requested)
- **No pricing section** — confidential, removed entirely
- **No 100-feature framework accordion** — removed
- **No founder/about section** — removed (photo, bio, quote)
- **No week-by-week process detail** — How It Works is now 3 clean steps
- **No "6 weeks" wording** — replaced with "quick" / "fast"
- **No audit report detail** in marketing copy

### Color & Theme
- Marketing site: light bg (`#F5F7FA`), dark navy primary (`#0a1628`)
- Customer dashboard: light slate (`bg-slate-50`) with sidebar
- Audit report + Admin clients: dark navy (`bg-[#0a1628]`) dark theme
- Admin dashboard: light slate with sidebar

### Client Logo Marquee
- Right-to-left CSS animation in `globals.css` (`.animate-marquee`, `@keyframes marquee`)
- Lives in `hero.tsx` trust strip

---

## Running the App

### Frontend (already running)
```bash
pnpm dev        # http://localhost:3000
pnpm build
pnpm start
```

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env            # fill in DATABASE_URL, SECRET_KEY, ANTHROPIC_API_KEY
uvicorn app.main:app --reload   # http://localhost:8000
```

### Backend env vars needed
| Var | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL async (`postgresql+asyncpg://...`) |
| `SECRET_KEY` | JWT signing key |
| `ANTHROPIC_API_KEY` | Claude API for gap analysis agents |
| `REDIS_URL` | Optional caching |
| `AWS_*` / `S3_BUCKET` | Optional file storage for recordings |

### Seed vendors
```bash
cd backend
python -m migrations.seed_industry_players
```

---

## API Client

`lib/api.ts` — typed wrapper around FastAPI. Set `NEXT_PUBLIC_API_URL` env var (defaults to `http://localhost:8000`).

```ts
import { api } from "@/lib/api"

// Auth
const { access_token } = await api.auth.login(email, password)

// Clients
const clients = await api.clients.list()
const gaps = await api.clients.gaps(clientId, "Critical")
```

---

## Pages Reference

| URL | Auth | Theme | Purpose |
|---|---|---|---|
| `/` | Public | Light | Marketing landing page |
| `/login` | Public | Light | Sign-in form |
| `/onboarding` | Public | Light | 6-step wizard → creates client + audit |
| `/dashboard` | Customer | Light + sidebar | Audit progress, KPIs, bar chart |
| `/audit` | Customer | Dark navy + sidebar | Full gap report, expandable cards |
| `/admin/dashboard` | Admin | Light + sidebar | All clients, data collection status |
| `/admin/clients` | Admin | Dark navy + sidebar | Client grid, search/filter |

---

## What's NOT Done Yet (next session picks up here)

- [ ] Auth is wired to UI only — no real JWT flow connecting login → dashboard
- [ ] Onboarding form doesn't POST to `api.clients.create()` yet
- [ ] Dashboard + audit pages use hardcoded mock data — need to fetch from backend
- [ ] Admin dashboard data is hardcoded — needs backend connection
- [ ] No route protection (middleware) — `/dashboard`, `/audit`, `/admin/*` are publicly accessible
- [ ] Backend has never been run in this repo — needs DB provisioning
- [ ] No `/roadmap` page yet (sidebar link exists, page missing)
- [ ] pnpm `approve-builds` for `sharp` and `msw` needs to be run once manually if node_modules is clean

---

## Reference Projects

- **D:\projects\CurveAI** — earlier prototype. Backend is the source of truth for the FastAPI code. Frontend was abandoned (different design). Do not copy frontend from here.
- **https://callcenterpower.com** — referenced for inspiration/positioning tone

---

## User Preferences

- No "6 weeks" wording anywhere — say "quick" or "fast"
- No pricing numbers public
- No founder details public
- Keep marketing copy lean — remove process detail
- The backend lives in `backend/` and is a FastAPI Python app — do not convert to Next.js API routes
