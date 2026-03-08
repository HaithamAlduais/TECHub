# TECHub - Sprint 0 Infrastructure

TECHub is a gamified tech career platform monorepo.
This repository is now set up for Sprint 0 (infrastructure only): no feature logic yet, but all base services, health checks, and database schema are in place.

## What was created

### Monorepo foundation
- pnpm workspace + Turborepo configuration
- Root scripts for running/building/linting/testing
- Shared environment variable template and .gitignore protections

### Frontend
- apps/web using Next.js + TypeScript + Tailwind
- Placeholder landing page at / with Sprint 0 status text

### Backend services (FastAPI)
All services are scaffolded with identical Sprint 0 structure:
- services/cv-aggregator (8001)
- services/ai-service (8002)
- services/opportunities (8003)
- services/apply-agent (8004)
- services/gamification (8005)
- services/notifications (8006)
- services/payment (8007)

Each service includes:
- requirements.txt
- .env.example
- app/config.py
- app/health.py
- app/main.py
- run.py
- package.json (for Turborepo orchestration)

### Database package
- packages/db/schema.sql with Sprint 0 schema
- packages/db/README.md with DB run instructions
- Schema applied and verified with 13 target tables

### Shared package
- packages/shared/constants.py with XP, levels, token package values, scoring weights, and constants used across services

## Repository structure

```text
TECHub/
  apps/
    web/
  services/
    cv-aggregator/
    ai-service/
    opportunities/
    apply-agent/
    gamification/
    notifications/
    payment/
  packages/
    db/
    shared/
  .env.example
  .gitignore
  package.json
  pnpm-workspace.yaml
  turbo.json
```

## Prerequisites

- Node.js >=20
- pnpm >=9
- Python 3.12+
- Access to Neon PostgreSQL + Upstash Redis

## Environment setup

1. Copy root env template:
   - .env.example -> .env
2. Copy service env templates:
   - services/*/.env.example -> services/*/.env
3. Fill real values for:
   - DATABASE_URL
   - REDIS_URL
   - and any service-specific keys needed later

## Install dependencies

From repo root:

```bash
pnpm install
```

For each backend service:

```bash
pip install -r requirements.txt
```

## Run locally

### Frontend

```bash
cd apps/web
pnpm dev
```

Opens on http://localhost:3000.

### Services

Run each service in a separate terminal:

```bash
cd services/cv-aggregator && python run.py
cd services/ai-service && python run.py
cd services/opportunities && python run.py
cd services/apply-agent && python run.py
cd services/gamification && python run.py
cd services/notifications && python run.py
cd services/payment && python run.py
```

## Health endpoints

- http://localhost:8001/health
- http://localhost:8002/health
- http://localhost:8003/health
- http://localhost:8004/health
- http://localhost:8005/health
- http://localhost:8006/health
- http://localhost:8007/health

Expected response shape:

```json
{
  "status": "healthy",
  "service": "service-name",
  "version": "0.0.1",
  "sprint": "Sprint 0 - Infrastructure",
  "checks": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" }
  }
}
```

## Database status

Sprint 0 schema has been executed and validated for these 13 core tables:
- users
- platform_connections
- skills
- work_experience
- skill_tree_nodes
- opportunities
- opportunity_matches
- applications
- xp_events
- badges
- tokens
- token_transactions
- notifications

## Notes

- This sprint intentionally includes infrastructure only.
- Feature routers are left as commented placeholders in each service for future sprints.
- Never commit real .env secrets.
