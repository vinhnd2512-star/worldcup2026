# WorldCup Predict

Private World Cup 2026 play-points prediction app.

## Preferred MVP Format

Use `vercel-static/` + Supabase + Vercel.

- No local `npm install`.
- No Python/FastAPI server needed for the hosted MVP.
- Supabase handles Auth, Postgres, RLS, RPC transactions, wallet ledger, bets, settlement, leaderboard, and admin user/market reports.
- Leaderboard score uses settled net points plus prediction bonuses; admin top-ups only affect wallet balance.
- Admin reports cover player performance, market performance, wallet ledger, recent predictions, ROI, accuracy, profit/loss, and CSV exports.
- Admin audit logs track user creation, password reset, wallet changes, bet placement, and settlement actions.
- Vercel hosts static HTML/CSS/JS and small server-side admin functions for creating Supabase Auth users, resetting passwords, and checking deployment env health without exposing secrets.
- Provider sync runs server-side in Vercel Functions, so sports API keys never reach the browser.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in SQL Editor.
3. Run `supabase/seed.sql`.
4. Run `supabase/seed_bracket.sql` to load the official FIFA knockout bracket.
5. Create the first admin auth user, then mark its profile as `admin` using the snippet in `supabase/README.md`.

## Vercel Deploy

1. Import the repo into Vercel.
2. Set **Root Directory** to `vercel-static`.
3. Leave **Install Command** and **Build Command** empty.
4. Set env vars:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` = Supabase publishable key (`sb_publishable_...`) or legacy anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase secret key (`sb_secret_...`) or legacy service role key
   - `CRON_SECRET`
   - `API_FOOTBALL_KEY`
   - `ODDS_API_KEY`
   - `FOOTBALL_DATA_API_TOKEN`
   - `MAX_STATS_FIXTURES` optional, defaults to `12`
5. Deploy.

For the full no-install deployment checklist, use `docs/deploy-checklist.md`.

For launch QA after deployment, use `docs/launch-smoke-test.md`.

For provider choices, odds coverage, and MVP market rules, use `docs/data-sources-and-markets.md`.

After Vercel is deployed, run the no-install deployment check:

```bash
node scripts/verify-deployment.mjs https://your-vercel-url.vercel.app
```

To also trigger provider sync from the deployment, set `CRON_SECRET` in your local shell and add `--sync`.

## Verify Before Deploy

Run the no-install static verification gate:

```bash
node scripts/verify-static.mjs
```

It checks deploy files, Vercel config, JavaScript syntax, environment variable template, hardcoded secret patterns, Supabase SQL contracts, and obvious encoding issues.

## Legacy Scaffold

`backend/` and `frontend/` are kept as the earlier FastAPI + React/Vite scaffold. The Supabase + Vercel static path is the current recommended route for a free MVP.
