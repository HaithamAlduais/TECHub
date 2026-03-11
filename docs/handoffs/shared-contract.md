# Shared MVP Contract

## MVP Database Target

Use the MVP table structure from [TECHUB-MVP-FINAL.md](../TECHUB-MVP-FINAL.md) as the source of truth.

**CV domain (Dev 1 & Dev 2):**
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

**Opportunities and tracker (Dev 3 & Dev 4):**
- `opportunities`
- `applications`

**Tokens (Haitham post-delivery):**
- `tokens` (balance, daily allocation, transaction history)

Support tables as needed: e.g. `onboarding_progress`, `password_reset_tokens`.

## Backend Service Ownership

- [services/cv-aggregator](services/cv-aggregator) — **Dev 1 & Dev 2** (pair): Auth, onboarding, all 7 connections, AI extraction, living CV, ATS export
- [services/opportunities](services/opportunities) — **Dev 3 & Dev 4** (pair): Opportunities, filters, auto-apply agent, tracker, notifications
- Tokens and payment — **Haitham** (post-delivery): Token balance, Stripe, daily free allocation, transaction history. No gamification in MVP.

## Vertical Ownership (Pair Model)

| Pair | Vertical | Handoff |
|------|----------|---------|
| Dev 1 & Dev 2 | Identity & CV | [dev1-dev2-identity-cv.md](dev1-dev2-identity-cv.md) |
| Dev 3 & Dev 4 | Opportunities & Apply | [dev3-dev4-opportunities.md](dev3-dev4-opportunities.md) |
| Haitham | Tokens, payment, AI matching, QA, UX/UI | Part 10 of [TECHUB-MVP-FINAL.md](../TECHUB-MVP-FINAL.md) |

## API Contract Lock (MVP)

- **Dev 1 & Dev 2:** Auth, user lifecycle, onboarding, user settings, public profile, integrations, import pipeline, CV assembled (`/cv/me`, public username), skill tags, ATS export
- **Dev 3 & Dev 4:** Opportunities list (5 types), filters, apply, tracker. Match % and gap view added by Haitham.
- **Haitham (post-delivery):** Token balance, deduction, daily reset, Stripe purchase, transaction history

## Handoff Rule

- Do not start UI integration for a route until request/response shape is fixed and shared in writing.
- Any change to endpoint path, payload, or response must be announced to all developers the same day.
