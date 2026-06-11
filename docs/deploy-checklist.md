# Deploy Checklist: Supabase + Vercel

Use this route when you want to deploy without installing Node, Python, or Postgres locally.

## 1. Supabase

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Run `supabase/seed.sql`.
4. Run `supabase/seed_bracket.sql`.
   - `schema.sql` also creates read-path indexes for bets, markets, wallet ledger, audit logs, and sync runs.
5. Go to Authentication and create the first admin user:
   - Email: `admin@worldcup.local`
   - Password: choose your own password
6. Copy that user's UUID, then run:

```sql
update public.profiles
set username = 'admin',
    display_name = 'Admin',
    role = 'admin',
    wallet_balance = 0
where id = '<AUTH_USER_UUID>';
```

## 2. Vercel

Before deploying, run this local no-install verification:

```bash
node scripts/verify-static.mjs
```

This also scans source files for common hardcoded secret patterns. Keep real Supabase/provider keys only in Supabase/Vercel dashboards, never in committed files.

1. Import this repository into Vercel.
2. Set **Root Directory** to `vercel-static`.
3. Leave **Install Command** empty.
4. Leave **Build Command** empty.
5. Add these environment variables:

```text
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
API_FOOTBALL_KEY=
ODDS_API_KEY=
ODDS_API_REGIONS=eu
ODDS_API_BOOKMAKERS=
FOOTBALL_DATA_API_TOKEN=
MAX_STATS_FIXTURES=12
```

`SUPABASE_ANON_KEY` should be the Supabase publishable key (`sb_publishable_...`) or legacy anon key and is safe for browser use. `SUPABASE_SERVICE_ROLE_KEY` should be the Supabase secret key (`sb_secret_...`) or legacy service role key. `SUPABASE_SERVICE_ROLE_KEY`, `API_FOOTBALL_KEY`, `ODDS_API_KEY`, and `FOOTBALL_DATA_API_TOKEN` must only exist in Vercel server-side environment variables.

`MAX_STATS_FIXTURES` is optional. Keep it low on free tiers because each synced statistics fixture costs an API-FOOTBALL request.

`ODDS_API_REGIONS` defaults to `eu`. To mirror one bookmaker instead of taking the best available regional price, set `ODDS_API_BOOKMAKERS` to a comma-separated list of The Odds API bookmaker keys, for example `pinnacle` or `pinnacle,betfair_ex_eu`. When this is set, bookmaker odds overwrite matching internal markets; markets that are missing from the provider remain internal.

## 3. First Smoke Test

Run the deployment health check from this repo:

```bash
node scripts/verify-deployment.mjs https://your-vercel-url.vercel.app
```

To test the live provider sync endpoint too, set `CRON_SECRET` in the local shell and run:

```bash
node scripts/verify-deployment.mjs https://your-vercel-url.vercel.app --sync
```

The script checks `/api/health` without printing secret values. With `--sync`, it calls `/api/sync-football-data` using the bearer secret and reports fixture, stats, and odds statuses.

Use `docs/launch-smoke-test.md` for the full launch QA script. The short version:

1. Open the Vercel URL.
2. Log in with `admin@worldcup.local`.
3. Open the Admin tab.
4. Confirm the Deployment health panel shows all required env vars as `OK`.
5. Create one player account with starting points.
6. Log out and log in as that player.
7. Place one prediction on a seeded match.
8. Log back in as admin, set the match result to `FT`, and settle it.
9. Check that History and Rankings update.
10. Open Admin and confirm Audit log shows the user creation, bet placement, wallet, or settlement action.
11. Check Player report and Market report, then filter Admin reports by one user/date range and export CSVs for rankings, reports, bets, ledger, and audit log.

## 4. Provider Sync

After adding `API_FOOTBALL_KEY` and `ODDS_API_KEY`, use the Admin tab's **Sync providers** button.

The Vercel Function `/api/sync-football-data` currently:

- upserts teams and fixtures from API-FOOTBALL World Cup 2026 (`league=1`, `season=2026`);
- syncs API-FOOTBALL match statistics for live/recent matches into `match_stats`, capped by `MAX_STATS_FIXTURES`;
- maps The Odds API 1X2 and total-goals odds into `match_markets` when event names and kickoff times match confidently;
- keeps provider total-goals lines per match instead of forcing 2.5, and only uses the internal 2.5 fallback when provider totals are missing;
- derives correct-score fair odds from synced 1X2 and total-goals lines because The Odds API rejects direct `correct_score` for this World Cup sport key;
- prefers configured bookmaker odds from `ODDS_API_BOOKMAKERS`; otherwise it uses the best available odds from `ODDS_API_REGIONS`;
- maps The Odds API tournament-winner outrights into `outright_markets` when team names match confidently;
- falls back to football-data.org World Cup fixtures when API-FOOTBALL is unavailable on the current plan;
- stores provider payloads in `odds_snapshots`;
- writes each sync attempt to `sync_runs`.

Review the first live sync result in the Admin tab. Unmatched odds events are skipped instead of guessed.

## 5. Free-First Notes

This project is designed for a small private group and keeps polling server-side to protect quotas. Before launch, check the current free-tier limits for Supabase, Vercel, API-FOOTBALL, and The Odds API because provider pricing can change.
