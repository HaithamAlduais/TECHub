# Developer 1 - CV Builder (MVP)

## Primary Responsibility
Build and maintain the CV backend: onboarding data intake, platform syncs, skill scoring, and assembled CV output.

## Edit These Files
- [services/cv-aggregator/app/main.py](services/cv-aggregator/app/main.py)
- [services/cv-aggregator/app/config.py](services/cv-aggregator/app/config.py)
- [services/cv-aggregator/app/db.py](services/cv-aggregator/app/db.py)
- [services/cv-aggregator/app/models/database.py](services/cv-aggregator/app/models/database.py)
- [services/cv-aggregator/app/routes/auth.py](services/cv-aggregator/app/routes/auth.py)
- [services/cv-aggregator/app/routes/onboarding.py](services/cv-aggregator/app/routes/onboarding.py)
- [services/cv-aggregator/app/routes/integrations.py](services/cv-aggregator/app/routes/integrations.py)
- [services/cv-aggregator/app/routes/import_center.py](services/cv-aggregator/app/routes/import_center.py)
- [services/cv-aggregator/app/routes/cv.py](services/cv-aggregator/app/routes/cv.py)
- [services/cv-aggregator/alembic/versions](services/cv-aggregator/alembic/versions)

## Required Endpoints (MVP)
- `POST /auth/register`
- `GET /github/auth-url`
- `GET /github/callback`
- `POST /github/sync`
- `GET /github/projects`
- `PATCH /github/projects/{id}`
- `POST /platforms/behance`
- `POST /platforms/hackerrank`
- `POST /platforms/kaggle`
- `POST /import/linkedin-pdf`
- `POST /import/cv-upload`
- `POST /import/paste`
- `POST /import/confirm`
- `POST /cv/experience`
- `POST /cv/certificate`
- `POST /cv/skill`
- `GET /skill-tags`
- `POST /cv/tags`
- `DELETE /cv/tags/{id}`
- `GET /cv/me`
- `GET /cv/{username}`
- `POST /cv/recalculate`

## Current Implementation Status
- Implemented now: `POST /auth/register`
- Implemented with different path prefix: `GET /integrations/github/connect`, `GET /integrations/github/callback`, `POST /integrations/hackerrank/connect`
- Partially covered: `POST /import/confirm` (exists, but import variants from contract are missing)
- Not implemented yet: all remaining endpoints in this section

## Database Reality Check
- Current model/migrations still include non-MVP tables (`developer_profiles`, gamification/tokens, notifications, onboarding/password reset support)
- MVP target tables were added to model + migration `004`, but still require migration execution and route-level adoption

## Integration Dependencies
- Must provide stable response contracts before Developer 4 binds UI.
- Must expose user skill output for Developer 2 matching engine.

## Done Checklist
- Migrations align to the MVP 10-table model
- Catalog seeding exists for `skill_tags_catalog`
- CV endpoint returns fully assembled object from real DB rows
