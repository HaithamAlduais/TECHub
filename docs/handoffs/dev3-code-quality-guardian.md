# Developer 3 - Code Quality Guardian (MVP)

## Primary Responsibility
Own quality gates across backend and frontend: tests, schema consistency, API contract checks, and release readiness.

## Review Scope
- [services/cv-aggregator](services/cv-aggregator)
- [services/opportunities](services/opportunities)
- [apps/web](apps/web)
- [docs/handoffs](docs/handoffs)

## Mandatory Quality Gates
- Backend route tests for auth paths and protected endpoints
- Validation tests for onboarding + import payloads
- Contract tests for CV and opportunities responses
- Frontend smoke flow: register/login -> onboarding -> profile/CV -> opportunities
- Lint + type checks in CI

## Weekly Audit Template
- API contract drift detected: yes/no
- Migration/schema drift detected: yes/no
- Broken user flows: list exact route and failing step
- Blockers by owner: Developer 1 / 2 / 4
- Required fixes before merge: explicit checklist

## Done Checklist
- All MVP-critical routes have basic happy-path and failure-path tests
- CI fails on lint/type/test failures
- Shared handoff docs remain accurate with current implementation
