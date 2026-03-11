# TECHub

Global proof-based tech talent exchange platform.

## Worktree Users

**If you're in a worktree:** Open the worktree folder as your workspace. All files (`.env`, configs) must be in that folder. See [docs/WORKTREE-SETUP.md](docs/WORKTREE-SETUP.md).

## Start Here

- **Single source of truth:** [docs/TECHUB-MVP-FINAL.md](docs/TECHUB-MVP-FINAL.md) — product, scope, team, architecture, handoff plan
- MVP handoffs and contracts: `docs/handoffs/`

## Quick Links

- Shared MVP contract: [docs/handoffs/shared-contract.md](docs/handoffs/shared-contract.md)
- Dev 1 & Dev 2 (Identity & CV): [docs/handoffs/dev1-dev2-identity-cv.md](docs/handoffs/dev1-dev2-identity-cv.md)
- Dev 3 & Dev 4 (Opportunities & Apply): [docs/handoffs/dev3-dev4-opportunities.md](docs/handoffs/dev3-dev4-opportunities.md)
- MVP implementation status: [docs/handoffs/mvp-implementation-status.md](docs/handoffs/mvp-implementation-status.md)
- MVP DB checklist: [docs/handoffs/mvp-db-reset-checklist.md](docs/handoffs/mvp-db-reset-checklist.md)

## Project Structure

- `apps/web/` — Next.js frontend
- `services/cv-aggregator/` — Auth, onboarding, connections, CV
- `services/opportunities/` — Opportunities, auto-apply, tracker
- `packages/` — shared config, types, utils
- `docs/` — MVP documentation and handoffs

## Running Locally

```bash
pnpm dev
```

## Environment

- Root `.env` contains `DATABASE_URL` for Neon.
- Service-level `.env.example` files show additional optional keys.
