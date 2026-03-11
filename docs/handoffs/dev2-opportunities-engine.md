# Developer 2 - Opportunities Engine (MVP)

## Primary Responsibility
Implement jobs ingestion, candidate-job matching, skills-gap analysis, and apply tracking APIs.

## Edit These Files
- [services/opportunities/app/main.py](services/opportunities/app/main.py)
- [services/opportunities/app/config.py](services/opportunities/app/config.py)
- [services/opportunities/app/db.py](services/opportunities/app/db.py)
- [services/opportunities/app/routes/jobs.py](services/opportunities/app/routes/jobs.py)
- [services/opportunities/app/routes/matching.py](services/opportunities/app/routes/matching.py)
- [services/opportunities/app/routes/tracker.py](services/opportunities/app/routes/tracker.py)
- [services/opportunities/app/services](services/opportunities/app/services)

## Required Endpoints (MVP)
- `GET /opportunities/list`
- `POST /opportunities/match`
- `GET /opportunities/gap-analysis`
- `POST /opportunities/apply`
- `GET /opportunities/tracker`

## Current Implementation Status
- Implemented now with different route shape:
  - `GET /opportunities/matched/{developer_id}`
  - `POST /opportunities/matched/{developer_id}/filter`
  - `GET /gap-analysis/{developer_id}/{opportunity_id}`
  - `GET /gap-analysis/{developer_id}/{opportunity_id}/skill-node/{skill_name}`
- Not implemented yet: `GET /opportunities/list`, `POST /opportunities/match`, `GET /opportunities/gap-analysis`, `POST /opportunities/apply`, `GET /opportunities/tracker`
- Current opportunities responses are placeholder payloads (empty arrays), not production matching output

## Core Matching Rules
- Calculate match score from overlap between required job skills and user verified skills
- Return missing skills ordered by expected impact
- Include explanation text for score transparency

## Integration Dependencies
- Consumes user skills from Developer 1 CV service output
- Provides normalized response shape for Developer 4 dashboard cards and tables

## Done Checklist
- APIs return deterministic schema with type-safe fields
- At least one provider/source path exists for opportunities data
- Tracker endpoint supports listing and status updates for applications
