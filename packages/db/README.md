# TECHub Database — packages/db

## How to run the schema
1. Go to your Neon dashboard at https://console.neon.tech
2. Select your project
3. Click "SQL Editor"
4. Paste the full contents of `schema.sql`
5. Click Run

## Tables
| Table | Purpose |
|-------|---------|
| users | Developer accounts |
| platform_connections | GitHub/HackerRank/Credly OAuth tokens |
| skills | Scored skills per developer |
| work_experience | Jobs history (self-reported or LinkedIn import) |
| skill_tree_nodes | Personalized learning tree per role |
| opportunities | Jobs/hackathons/co-ops scraped and stored |
| opportunity_matches | Per-user match scores vs opportunities |
| applications | Application pipeline tracker |
| xp_events | Every XP award logged (source of truth) |
| badges | Milestone achievements |
| tokens | Daily free + purchased token balance |
| token_transactions | Every token movement |
| notifications | In-app notification log |
