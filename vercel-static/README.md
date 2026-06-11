# Vercel Static App

This is the preferred free MVP format: static HTML/CSS/JS + Supabase + small Vercel Functions.

## Deploy

1. Push this repo to GitHub.
2. Create a Vercel project.
3. Set **Root Directory** to `vercel-static`.
4. Leave **Install Command** and **Build Command** empty.
5. Add Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` = Supabase publishable key (`sb_publishable_...`) or legacy anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase secret key (`sb_secret_...`) or legacy service role key
   - `CRON_SECRET`
   - `API_FOOTBALL_KEY`
   - `ODDS_API_KEY`
   - `FOOTBALL_DATA_API_TOKEN`
   - `MAX_STATS_FIXTURES` optional, defaults to `12`
   - `MAX_TRANSFERMARKT_TEAMS` optional, defaults to `48`
6. Deploy.

No `npm install` is required for this folder. The browser loads Supabase from CDN.

Use `.env.example` as the list of Vercel environment variables. Do not commit real keys.

## Local Preview Without Install

Open `index.html` directly. If there is no Vercel `/api/config` function locally, the app shows a setup form where you can paste the Supabase URL and anon key.

The admin create-user, reset-password, health-check, and provider-sync functions only work after deploying to Vercel because they need server-side environment variables.

`/api/health` returns only boolean readiness flags for required environment variables. It never returns secret values. The Admin Dashboard displays this as Deployment health.

## Provider Sync

`/api/sync-football-data` syncs World Cup 2026 fixtures from API-FOOTBALL (`league=1`, `season=2026`) into Supabase teams/matches, and falls back to football-data.org (`competition=WC`, `season=2026`) when API-FOOTBALL is unavailable on the current plan. It also syncs live/recent match statistics into `match_stats` for corners/cards settlement when API-FOOTBALL fixture IDs are available. It maps The Odds API 1X2 and total-goals odds into `match_markets`, plus tournament-winner outrights into `outright_markets`, when provider names match confidently. Total-goals lines come from each bookmaker event (for example 2.25, 2.5, 2.75, or 3.0); the internal 2.5 fallback stays open only when provider totals are missing. The Odds API does not currently support `correct_score` for this sport key, so correct-score multipliers remain internal/admin odds. Set `ODDS_API_BOOKMAKERS` to comma-separated bookmaker keys such as `pinnacle` to mirror specific bookmaker prices; otherwise the sync uses the best available odds from `ODDS_API_REGIONS` (default `eu`). Markets missing from the provider remain on internal odds. Admins can trigger a separate best-effort Transfermarkt market-value crawl from the Admin UI; if it is blocked or incomplete, paste normalized CSV/JSON into the Transfermarkt import form. The function can be triggered from the Admin tab or by Vercel Cron.

For cron/manual server calls, send:

```text
Authorization: Bearer <CRON_SECRET>
```

Vercel Cron automatically sends this header when `CRON_SECRET` is configured in the project environment.

Unmatched odds events are skipped instead of guessed. Review the first live sync after API keys are configured.
