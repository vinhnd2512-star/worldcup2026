# Session Progress

## 2026-06-04

Implemented initial full-stack MVP scaffold, then switched the preferred deployment route to Supabase + Vercel static hosting.

Done:

- Created `backend/` FastAPI app with SQLAlchemy models, seed data, auth, player routes, admin routes, provider adapter scaffolds, and settlement service.
- Created `frontend/` React/Vite app using the Pitch Perfect visual direction from `UI_Stitch`.
- Added pure Python settlement tests covering MVP markets.
- Added preferred no-install deployment path: `vercel-static/` plus `supabase/schema.sql` and `supabase/seed.sql`.
- Added Vercel function for admin-created Supabase Auth users.
- Added Vercel function and Admin tab form for admin password resets.
- Added Vercel provider sync function for API-FOOTBALL fixtures and The Odds API status logging, callable from Admin tab or Vercel Cron with `CRON_SECRET`.
- Added no-install Supabase/Vercel deploy checklist and Vercel env example.
- Added detailed launch smoke test covering admin account flow, player betting, settlement, reporting, provider sync, and common deployment failures.
- Added data source and market reference doc for API-FOOTBALL, The Odds API, fallback fixture data, and FPL-style extensions.
- Fixed corrupted Vietnamese labels in the static app and Supabase seed data.
- Added conservative The Odds API mapping for 1X2 and total-goals markets into `match_markets`, with raw provider snapshots stored in `odds_snapshots`.
- Added `line_key` uniqueness support so markets with no numeric line do not duplicate across sync/seed runs.
- Added capped API-FOOTBALL `/fixtures/statistics` sync into `match_stats` for corners/cards settlement.
- Added player-facing odds freshness labels showing internal/The Odds API source, bookmaker when available, and provider update time.
- Added draw-no-bet as a professional-style match market with provider mapping, seed data, settlement refund-on-draw rule, and tests.
- Hardened `place_bet` so non-score selections must match the selected market row; stored option labels come from the market row, and correct-score key/label are derived from non-negative score payloads.
- Added Admin Dashboard market controls backed by `admin_update_match_market`, allowing manual multiplier/lock/open-state overrides with audit logging.
- Added Admin Dashboard outright controls backed by `admin_update_outright_market`, allowing manual tournament-winner multiplier/lock/open-state overrides with audit logging.
- Added Supabase indexes for common read/write paths: bet history, open settlements, market lookup, wallet ledger, audit logs, sync runs, and match ordering.
- Added admin player report, recent prediction tracking, wallet ledger view, and CSV exports for rankings, bets, and ledger.
- Added tournament winner/outright market flow with seeded selections, player betting, and admin settlement.
- Added prediction bonus scoring separate from wallet payouts; leaderboard now combines settled net points and accuracy bonuses.
- Added audit logging for bets, wallet adjustments, user creation, password resets, match settlements, and tournament settlements, with Admin Dashboard view/export.
- Added `admin_void_bet` and Admin Dashboard void action for refunding a single placed bet with settlement, ledger, and audit records.
- Added The Odds API `outrights` sync into `outright_markets` for tournament-winner multipliers when provider team names match Supabase teams.
- Added admin user and market report views with profit/loss, bonuses, score, accuracy, ROI, plus combined reports CSV export.
- Added Admin Dashboard report filters by user/date range for recent predictions, wallet ledger, audit logs, and their CSV exports.
- Added settlement wallet ledger entries for winning payouts and void refunds, so wallet history reconciles with balance changes.
- Added `scripts/verify-static.mjs` as a no-install pre-deploy verification gate for the Supabase/Vercel static app.
- Extended static verification with a source secret scan so real Supabase/provider keys stay out of committed files.
- Added `/api/health` and an Admin Dashboard deployment health panel to verify required Vercel env vars without exposing secret values.
- Added root README, MVP spec, and Harness-style feature list.
- Verified static JS syntax, Vercel function syntax, JSON files, static deploy contracts, encoding smoke checks, and legacy settlement tests.

Next:

- Create Supabase project, run schema/seed, and deploy `vercel-static/` on Vercel.
- Configure `CRON_SECRET`, `API_FOOTBALL_KEY`, and `ODDS_API_KEY` in Vercel and review the first live `/api/sync-football-data` mapping results.
- Add browser visual QA screenshots against `UI_Stitch` after Supabase env is configured.

Update 2026-06-05:

- Local `vercel-static/.env` now has valid-shaped Supabase publishable/secret keys, `CRON_SECRET`, API-FOOTBALL key, Odds API key, and `MAX_STATS_FIXTURES`.
- `node scripts/verify-static.mjs` passes including local env readiness.
- Live Supabase REST check reaches the configured project, but the project does not yet have `public.teams`; run `supabase/schema.sql` then `supabase/seed.sql` in that Supabase project.
- Live Odds API check succeeds for `soccer_fifa_world_cup`.
- Live API-FOOTBALL check returns that the free plan does not have access to season 2026. The sync endpoint now reports API-FOOTBALL failure per job and continues other providers instead of failing the whole sync.
- This environment has no `git`, `gh`, `vercel`, npm/npx, or browser test runner in PATH. GitHub MCP can write files only to an existing repo; Vercel MCP is not exposed in this session.

Known gaps:

- FastAPI/React dependencies are not needed for the preferred static Supabase path.
- Git is not available in PATH.
