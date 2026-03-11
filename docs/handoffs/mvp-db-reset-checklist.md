# MVP Database Reset Checklist

## Important Current-State Note
- Current migrations do not yet create the MVP 10-table target schema.
- Run the "schema audit" step first, then apply the MVP-alignment migration set before using this checklist as final verification.

## Schema Audit (Before Reset)
- List current public tables:
  - `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;`
- Compare with MVP target list in [Shared Contract](docs/handoffs/shared-contract.md).

## Reset Steps
- Stop running API services
- Point local env to target database
- Drop and recreate schema/database
- Run all Alembic migrations for `cv-aggregator` (including new MVP-alignment migrations when added)
- Seed `skill_tags_catalog`
- Start services and run health checks

## Verify Tables
Confirm these tables exist:
- `users`
- `platform_connections`
- `projects`
- `skills`
- `skill_evidence`
- `experiences`
- `certificates`
- `competitions`
- `skill_tags_catalog`
- `user_skill_tags`

## SQL Verification
Run these checks:
- `SELECT COUNT(*) FROM skill_tags_catalog;`
- `SELECT COUNT(*) FROM users;`
- `SELECT COUNT(*) FROM skills;`
- `SELECT COUNT(*) FROM user_skill_tags;`

## Post-Migration Drift Check
- Confirm no outside-MVP tables remain:
  - `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('developer_profiles','skill_tree_nodes','xp_events','badges','tokens','token_transactions','notifications','onboarding_progress','password_reset_tokens');`
- Expected result: zero rows (after final cleanup phase)

## API Sanity Verification
- `GET /health` returns healthy dependencies
- `GET /skill-tags` returns catalog entries
- `GET /cv/me` returns valid empty or populated MVP shape for authenticated user
