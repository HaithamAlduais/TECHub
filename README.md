# TECHub

> **The Global Tech Talent Exchange** · Proof-based tech career platform
> King Saud University · SWE-444 Capstone · 2026

---

## What is TECHub?

A platform where developers **prove** their skills instead of just listing them.
Connect GitHub, HackerRank, Kaggle → AI extracts and scores your skills → living CV auto-generates → matched opportunities appear → one-tap apply → tracker.

---

## Project Structure & Tech Stack

### What You Touch

| Folder | What it is | Language / Framework |
|--------|-----------|----------------------|
| `apps/web/` | Frontend — all pages and UI | TypeScript · Next.js 14 · Tailwind |
| `services/cv-aggregator/` | Backend — auth, CV, connections | Python · FastAPI · SQLAlchemy |
| `services/opportunities/` | Backend — feed, apply, tracker | Python · FastAPI · SQLAlchemy |
| `packages/types/` | Shared TypeScript types | TypeScript |
| `packages/utils/` | Shared utility functions | TypeScript |

### What You Don't Touch

| File / Folder | What it does |
|---------------|-------------|
| `docker-compose.yml` | Runs all services together |
| `nginx/nginx.conf` | Routes requests to the right service |
| `.github/workflows/` | Auto-checks code on every push |
| `turbo.json` | Monorepo build pipeline |
| `pnpm-workspace.yaml` | Tells pnpm which folders are packages |
| `scripts/` | Dev startup helpers |
| `.env` | Your secrets — copy from `.env.example`, fill in, never commit |

### Database

**PostgreSQL on Neon (cloud).** Same DB, different tables per service.

| Table | Owned by |
|-------|---------|
| `users`, `platform_connections`, `projects`, `skills`, `skill_evidence`, `experiences`, `certificates`, `competitions`, `skill_tags_catalog`, `user_skill_tags` | Dev 1 & Dev 2 |
| `opportunities`, `applications` | Dev 3 & Dev 4 |
| `tokens` | Haitham (post-MVP) |

---

## Dev Ownership

### Dev 1 & Dev 2 — Identity & CV
**Files:** `services/cv-aggregator/app/routes/` → auth, onboarding, integrations, import_center, cv

**Build:**
- Auth: register, login, Google OAuth, forgot/reset password
- 6-step onboarding wizard (Step 4+ locked until one proof is connected)
- 7 proof connections: GitHub (OAuth), HackerRank, Kaggle, Behance/portfolio URL, LinkedIn PDF upload, Certificate upload, CV upload
- All connections → GPT-4o extraction → developer confirms each item → skill scoring
- Living CV (in-app, interactive, never exported) with trust tiers: AI-Verified · Platform-Connected · Self-Reported
- ATS export: JSON, PDF, Word (costs tokens per export)
- Public profile: `techub.io/@username`

**Done when:** All 7 connections ingest + extract, skill scoring runs, living CV renders, ATS export works, public profile live.

---

### Dev 3 & Dev 4 — Opportunities & Apply
**Files:** `services/opportunities/app/routes/` + `apps/web/` (opportunity cards, tracker UI)

**Build:**
- 3 opportunity categories:
  - **Jobs, Co-op & GDP programs** (employment and training programs)
  - **Workshops, Hackathons, Bootcamps & Competitions** (Kaggle, HackerRank, etc.)
  - **Events, Expos & Talks**
- Sources: scraped from multiple platforms (Devpost, Tamheer, Taqat, Twaiq and others — not a fixed list)
- Filters: location, remote, salary, domain, experience level
- Auto-apply agent (Stagehand): opens URL → fills form from CV data → submits. Live preview panel. ToS warning. Never applies twice.
- Tracker: Applied → Viewed → Interview → Offer → Rejected (manually updatable)
- Notifications: status change, CV updated, new high-match opportunity, low tokens
- Token deduction: first load per tab free; manual refresh costs tokens

**Done when:** All 5 types filterable, Stagehand wired, tracker pipeline works, notifications fire.

> ⚠️ Match % and gap analysis are **Haitham's layer** — you don't build that.

---

### Haitham (Lead) — Post-MVP
- Token system (balance, daily reset, Stripe, transaction history)
- AI matching engine (match % + gap view between CV and opportunity)
- Production UX/UI polish

---

## Running Locally

```bash
# 1. Copy env file and fill in values (ask Haitham)
cp .env.example .env

# 2. Install frontend deps
pnpm install

# 3. Install backend deps
pip install -r services/cv-aggregator/requirements.txt
pip install -r services/opportunities/requirements.txt

# 4. Run DB migrations
cd services/cv-aggregator && alembic upgrade head && cd ../..
cd services/opportunities && alembic upgrade head && cd ../..

# 5. Start everything
pnpm dev
```

| URL | What |
|-----|------|
| http://localhost:3000 | Frontend |
| http://localhost:8001/docs | cv-aggregator API (Swagger UI) |
| http://localhost:8003/docs | opportunities API (Swagger UI) |

---

## MVP Scope (what we're building right now)

The core loop: **Connect Proof → CV Auto-Generates → Opportunities Matched → Apply → Track**

**In scope:**
- Auth + onboarding (US-01–05)
- 7 platform connections + AI extraction (US-06–13)
- Living CV + ATS export (US-14–20)
- Opportunities feed + filters (US-21–25)
- Auto-apply agent (US-26–29)
- Tracker + notifications (US-30–34)
- Token system (US-35–37) ← Haitham, post-delivery

**Not in scope for MVP:**
- Gamification (no XP, levels, badges, leaderboard, Skill Tree)
- Company portal
- Free-form AI chatbot
- Subscription model (tokens only)

---

## After MVP — Next Versions

| Version | What gets added |
|---------|----------------|
| **V0** | Skill Tree · Gamification · XP system |
| **V1** | Company portal (post jobs, search talent, invite to apply) |
| **V2** | IDE integration · Real-time skill tracking from code activity |
| **V3** | Community · Mentor matching · Team formation for hackathons |

---

## Sprints

| Sprint | Focus |
|--------|-------|
| Sprint 0 | Infra setup, repo, DB, CI/CD |
| Sprint 1 | Auth, onboarding, first connection (GitHub) |
| Sprint 2 | All 7 connections, full CV, ATS export |
| Sprint 3 | Opportunities, auto-apply, tracker |
| Sprint 4 | Payment, admin, polish, launch |

---

## Rules

- Do not start UI integration until the API shape is agreed and written down.
- Any endpoint change must be announced to all devs the same day.
- Every feature needs a test before merge.
- Never commit `.env`.
- Questions about scope → Haitham.
