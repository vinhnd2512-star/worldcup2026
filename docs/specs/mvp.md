# Spec: MVP WorldCup Predict

**Status**: implemented static Supabase/Vercel scaffold
**Date**: 2026-06-04

## Goal

Create a private points prediction app for World Cup 2026 with login, match markets, betting, leaderboard, history, and admin controls.

## Scope

- Supabase SQL schema with users, wallet ledger, teams, matches, markets, bets, settlements, sync runs, and audit-ready data.
- Static Vercel frontend based on the Pitch Perfect UI direction.
- Vercel serverless admin endpoint for creating Supabase Auth users without exposing the service key.
- Vercel serverless provider sync endpoint for API-FOOTBALL fixtures and The Odds API status logging without exposing sports API keys.
- Seed data for fixtures and MVP markets.
- Data source and market notes in `docs/data-sources-and-markets.md`.
- Legacy FastAPI/React scaffold retained as an alternate path.

## Out Of Scope

- Real-money betting, payments, KYC, public registration.
- Full odds-to-fixture normalization for bookmaker markets.
- Full bookmaker odds normalization for all corner/card markets.

## Acceptance Criteria

- Player can log in via Supabase Auth, view fixtures, place match and tournament-winner points bets through RPC transactions, and see history.
- Player can see odds multipliers with source/freshness context for synced bookmaker odds and internal fixed markets.
- Match markets include correct score, 1X2, draw no bet, over/under goals, BTTS, corners, and cards.
- Admin can create users, top up/deduct points, freeze/unfreeze users, reset passwords, see player and market reports, export CSV files, update match/outright odds multipliers, open/close markets, update results, settle a match, and settle tournament-winner bets.
- Admin can void a single placed bet with a reason; the stake is refunded, wallet ledger is updated, and the action is audited.
- Admin reports include wallet balance, open/settled bets, stake, profit/loss, prediction bonuses, score, accuracy, ROI, recent predictions, wallet ledger, and market-level performance.
- Admin can filter recent predictions, wallet ledger, audit logs, and related CSV exports by user and date range.
- Admin can review audit logs for player bets, wallet adjustments, match/outright market changes, user creation, password resets, and settlements.
- Admin can trigger provider sync; Vercel Cron can call the same endpoint with `CRON_SECRET`.
- Bets lock by match kickoff.
- Bet placement RPC validates and derives stored selections server-side; option bets must match the selected market row, while correct-score bets require explicit non-negative home/away scores.
- Admin top-ups affect wallet balance but leaderboard score uses settled bet net points plus prediction bonuses.
- Wallet ledger records stake deductions, winning payouts, void refunds, admin top-ups, and admin deductions.
- Supabase schema includes indexes for common player history, admin reports, settlement, sync, audit, and market lookup paths.
- Settlement rules are implemented in Supabase RPC and mirrored by Python unit tests in the legacy backend scaffold.

## Stop Conditions

- Do not expose provider API keys or Supabase service role key in frontend.
- Do not enable real-money flows.
- Do not poll sports APIs directly from the browser.
