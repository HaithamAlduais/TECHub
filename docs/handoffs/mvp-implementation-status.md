# MVP Implementation Status

## Vertical Ownership (see [TECHUB-MVP-FINAL.md](../TECHUB-MVP-FINAL.md))

| Pair | Vertical | Handoff |
|------|----------|---------|
| Dev 1 & Dev 2 | Identity & CV (auth, onboarding, 7 connections, living CV, ATS export) | [dev1-dev2-identity-cv.md](dev1-dev2-identity-cv.md) |
| Dev 3 & Dev 4 | Opportunities & Apply (5 types, filters, auto-apply, tracker, notifications) | [dev3-dev4-opportunities.md](dev3-dev4-opportunities.md) |
| Haitham | Tokens, payment, AI matching, QA, UX/UI (post-delivery where noted) | Part 10 of TECHUB-MVP-FINAL.md |

## Backend Route Inventory (Live)

### Dev 1 & Dev 2 — Identity & CV (cv-aggregator)
- `POST /auth/register` (implemented)
- `POST /auth/login` (implemented)
- `POST /auth/forgot-password` (implemented)
- `POST /auth/reset-password` (implemented)
- `POST /onboarding/step` (implemented)
- `GET /onboarding/{developer_id}` (implemented)
- `GET /onboarding/{developer_id}/can-continue` (implemented)
- `GET /integrations/github/connect` (implemented)
- `GET /integrations/github/callback` (implemented)
- `POST /integrations/hackerrank/connect` (implemented)
- `POST /integrations/credly/connect` (implemented)
- `POST /import/upload` (implemented)
- `POST /import/confirm` (implemented)
- `DELETE /import/item/{item_id}` (implemented)
- `GET /cv/{user_id}` (implemented)
- Pending: full 7 integrations, GPT-4o extraction, skill scoring, living CV, ATS export

### Dev 3 & Dev 4 — Opportunities & Apply (opportunities)
- `GET /opportunities/matched/{developer_id}` (implemented)
- `POST /opportunities/matched/{developer_id}/filter` (implemented)
- `GET /gap-analysis/{developer_id}/{opportunity_id}` (implemented)
- `GET /gap-analysis/{developer_id}/{opportunity_id}/skill-node/{skill_name}` (implemented)
- Pending: Stagehand auto-apply agent, full tracker status pipeline, notifications

### Haitham — Tokens & Payment (post-delivery)
- Pending: token system, Stripe, balance, daily reset, transaction history

## Contract Coverage by Vertical

### Dev 1 & Dev 2 Contract
- Auth, onboarding, 7 connections, import pipeline, CV assembled, skill tags, ATS export → see [dev1-dev2-identity-cv.md](dev1-dev2-identity-cv.md)
- Match % and gap view → Haitham's layer (consumes CV + opportunity shapes)

### Dev 3 & Dev 4 Contract
- Opportunities list (5 types), filters, auto-apply, tracker, notifications → see [dev3-dev4-opportunities.md](dev3-dev4-opportunities.md)
- Match % and gap view → Haitham's layer (consumes Dev 1 & Dev 2 CV + Dev 3 & Dev 4 opportunity shapes)

## Database Status

### MVP Target Schema (CV domain — Dev 1 & Dev 2)
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

### Opportunities and tracker (Dev 3 & Dev 4)
- `opportunities`
- `applications`

### Tokens (Haitham post-delivery)
- `tokens` (balance, daily allocation, transaction history)

Support tables: e.g. `onboarding_progress`, `password_reset_tokens` as needed.
