# Developer 4 - UI Builder (MVP)

## Primary Responsibility
Build and wire all MVP frontend pages and components to the final backend contracts.

## Edit These Files
- [apps/web/app/page.tsx](apps/web/app/page.tsx)
- [apps/web/app/login/page.tsx](apps/web/app/login/page.tsx)
- [apps/web/app/register/page.tsx](apps/web/app/register/page.tsx)
- [apps/web/app/onboarding/page.tsx](apps/web/app/onboarding/page.tsx)
- [apps/web/app/profile/page.tsx](apps/web/app/profile/page.tsx)
- [apps/web/app/opportunities/page.tsx](apps/web/app/opportunities/page.tsx)
- [apps/web/lib/session.ts](apps/web/lib/session.ts)
- [apps/web/components](apps/web/components)

## MVP UI Pages
- Landing page with value proposition and auth entry points
- Login/register pages
- Onboarding wizard with step save + continue
- Profile/CV page from backend assembled response
- Opportunities page with list, match score, gap insights, and tracker

## Integration Order
- Step 1: auth/session flow
- Step 2: onboarding read/write
- Step 3: profile/CV rendering
- Step 4: opportunities list + apply + tracker

## Done Checklist
- No mocked payload in production path for MVP screens
- All API calls use central session/auth helper
- User can complete full end-to-end MVP journey from UI only
