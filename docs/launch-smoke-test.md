# Launch Smoke Test: WorldCup Predict

Run this after Supabase schema/seed, Vercel deployment, and environment variables are configured.

## Preflight

1. Open the Vercel URL.
   - Expected: app loads without a config form.
2. Log in as the first admin.
   - Expected: Admin tab is visible.
3. Open Admin Dashboard.
   - Expected: Deployment health shows all required env vars as `OK`.

## Admin Account Flow

1. Create a player with starting points.
   - Expected: player appears in the account list and wallet ledger records the starting balance/top-up.
2. Reset that player's password.
   - Expected: audit log records `admin.password_reset`.
3. Freeze and reopen the player.
   - Expected: account row toggles between locked/open states.

## Player Betting Flow

1. Log in as the player.
   - Expected: balance, fixtures, markets, tournament winner options, rankings, and history render.
2. Place a correct-score bet.
   - Expected: wallet decreases by stake, app opens Prediction stats > Upcoming, and the open prediction count increases.
3. Place one non-score market bet, preferably `draw_no_bet`.
   - Expected: wallet decreases by stake and the stored selection label matches the market option.
4. Place a tournament-winner bet.
   - Expected: Prediction stats shows an outright bet with locked multiplier.
5. Edit the open correct-score prediction before lock time.
   - Expected: score/stake update succeeds, multiplier is re-locked from the current market, wallet ledger records only the stake delta, and audit log records `bet.update`.
6. Try editing the same bet after moving the match out of pre-match status or after lock time.
   - Expected: update is blocked by the `update_bet` RPC.

## Settlement Flow

1. Log back in as admin.
2. Set a seeded match result to `FT` and settle it.
   - Expected: placed match bets change to `won`, `lost`, or `refunded`.
3. Confirm wallet ledger.
   - Expected: stakes, payouts, and refunds reconcile with the player's wallet balance.
4. Confirm Rankings.
   - Expected: leaderboard score equals settled net points plus prediction bonuses.
5. Void one still-open placed bet from Recent predictions.
   - Expected: bet becomes `refunded`, stake returns, settlement row exists, audit log shows `bet.void`.
6. Reopen Prediction stats.
   - Expected: settled bets appear in Completed/History, while only still-placed bets remain in Upcoming.

## Reporting Flow

1. Apply Admin report filters for the player and a date range covering today.
   - Expected: Recent predictions, wallet ledger, and audit log narrow to that range.
2. Export rankings, reports, bets, ledger, and audit CSVs.
   - Expected: each CSV downloads and respects active filters where applicable.

## Provider Sync Flow

1. Click **Sync providers** in Admin.
   - Expected: message reports fixture, stats, and odds sync statuses.
2. Review Sync runs.
   - Expected: API-FOOTBALL and The Odds API rows show success or clear skipped/error messages.
3. Review odds freshness on player markets.
   - Expected: synced markets show source/bookmaker/update time; internal markets remain labeled internal/admin.

## Common Failures

- Config form appears on Vercel: `SUPABASE_URL` or `SUPABASE_ANON_KEY` is missing.
- Admin functions fail: `SUPABASE_SERVICE_ROLE_KEY` is missing or invalid.
- Provider sync skips: `API_FOOTBALL_KEY` or `ODDS_API_KEY` is missing.
- Player cannot see data: RLS policies or schema/seed were not run in the right Supabase project.
- Settlement does nothing: match status is not final/void, or no bets are still `placed`.
